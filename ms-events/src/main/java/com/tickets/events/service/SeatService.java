package com.tickets.events.service;

import com.tickets.events.model.Seat;
import com.tickets.events.model.SeatStatus;
import com.tickets.events.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeatService {

    private final SeatRepository seatRepository;

    /**
     * Block seats for a reservation. Transitions AVAILABLE → RESERVED with optimistic locking.
     * @param eventId Event ID
     * @param seatIds Seat IDs to block
     * @param idempotencyKey Idempotency key for safe retries
     * @throws ObjectOptimisticLockingFailureException If seat was concurrently modified
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void blockSeats(UUID eventId, List<UUID> seatIds, UUID idempotencyKey) {
        log.info("Blocking {} seats for event={}, idempotencyKey={}", seatIds.size(), eventId, idempotencyKey);

        List<Seat> seats = seatRepository.findAllById(seatIds);
        
        if (seats.size() != seatIds.size()) {
            log.error("Attempted to block non-existent seats: requested={}, found={}", seatIds.size(), seats.size());
            throw new IllegalArgumentException("One or more seats do not exist");
        }

        // Validate all are in correct state and belong to correct event
        for (Seat seat : seats) {
            if (!seat.getEventId().equals(eventId)) {
                throw new IllegalArgumentException("Seat=" + seat.getId() + " does not belong to event=" + eventId);
            }
            if (!seat.getStatus().equals(SeatStatus.AVAILABLE)) {
                log.warn("Cannot block seat={} with status={}; must be AVAILABLE", seat.getId(), seat.getStatus());
                throw new IllegalStateException("Seat " + seat.getId() + " is not available");
            }
        }

        // Update status to RESERVED with @Version check
        for (Seat seat : seats) {
            seat.setStatus(SeatStatus.RESERVED);
            seat.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }

        try {
            seatRepository.saveAll(seats);
            log.info("Successfully blocked {} seats for event={}", seatIds.size(), eventId);
        } catch (ObjectOptimisticLockingFailureException ex) {
            log.error("Optimistic lock conflict while blocking seats: {}", ex.getMessage());
            throw ex; // Let caller handle retry
        }
    }

    /**
     * Release seats back to AVAILABLE state. Used on reservation expiration.
     * @param eventId Event ID
     * @param seatIds Seat IDs to release
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void releaseSeats(UUID eventId, List<UUID> seatIds) {
        log.info("Releasing {} seats for event={}", seatIds.size(), eventId);

        List<Seat> seats = seatRepository.findAllById(seatIds);
        
        if (seats.isEmpty()) {
            log.warn("No seats found to release for ids={}", seatIds);
            return;
        }

        for (Seat seat : seats) {
            if (!seat.getEventId().equals(eventId)) {
                log.warn("Seat={} does not belong to event={}; skipping release", seat.getId(), eventId);
                continue;
            }
            if (seat.getStatus().equals(SeatStatus.RESERVED)) {
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                log.debug("Released seat={} to AVAILABLE", seat.getId());
            }
        }

        seatRepository.saveAll(seats);
        log.info("Released {} seats for event={}", seatIds.size(), eventId);
    }

    /**
     * Confirm seats as SOLD after successful payment. Transitions RESERVED → SOLD.
     * @param eventId Event ID
     * @param seatIds Seat IDs to confirm as sold
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void sellSeats(UUID eventId, List<UUID> seatIds) {
        log.info("Confirming {} seats as SOLD for event={}", seatIds.size(), eventId);

        List<Seat> seats = seatRepository.findAllById(seatIds);
        
        if (seats.isEmpty()) {
            log.error("No seats found to confirm as sold for ids={}", seatIds);
            throw new IllegalArgumentException("One or more seats do not exist");
        }

        for (Seat seat : seats) {
            if (!seat.getEventId().equals(eventId)) {
                throw new IllegalArgumentException("Seat=" + seat.getId() + " does not belong to event=" + eventId);
            }
            if (!seat.getStatus().equals(SeatStatus.RESERVED)) {
                log.warn("Cannot sell seat={} with status={}; must be RESERVED", seat.getId(), seat.getStatus());
                throw new IllegalStateException("Seat " + seat.getId() + " is not reserved");
            }
        }

        for (Seat seat : seats) {
            seat.setStatus(SeatStatus.SOLD);
            seat.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }

        seatRepository.saveAll(seats);
        log.info("Successfully confirmed {} seats as SOLD for event={}", seatIds.size(), eventId);
    }

    /**
     * Get available seats for an event/tier. Returns AVAILABLE seats only.
     * @param eventId Event ID
     * @param tierId Tier ID
     * @return List of available seats
     */
    @Transactional(readOnly = true)
    public List<Seat> getAvailableSeats(UUID eventId, UUID tierId) {
        log.info("Fetching available seats for event={}, tier={}", eventId, tierId);
        return seatRepository.findByEventIdAndTierIdAndStatus(eventId, tierId, SeatStatus.AVAILABLE);
    }

    /**
     * Get seats by status (used for inventory checks).
     * @param eventId Event ID
     * @param status Status filter
     * @return List of seats with given status
     */
    @Transactional(readOnly = true)
    public List<Seat> getSeatsByStatus(UUID eventId, SeatStatus status) {
        log.info("Fetching {} seats for event={}", status, eventId);
        return seatRepository.findByEventIdAndStatus(eventId, status);
    }

    /**
     * Get capacity metrics for event/tier (available, reserved, sold).
     * @param eventId Event ID
     * @param tierId Tier ID
     * @return Map with counts by status
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCapacityMetrics(UUID eventId, UUID tierId) {
        log.info("Calculating capacity metrics for event={}, tier={}", eventId, tierId);
        
        List<Seat> allSeats = seatRepository.findByEventIdAndTierId(eventId, tierId);
        
        return allSeats.stream()
            .collect(Collectors.groupingBy(
                s -> s.getStatus().toString(),
                Collectors.counting()
            ));
    }
}
