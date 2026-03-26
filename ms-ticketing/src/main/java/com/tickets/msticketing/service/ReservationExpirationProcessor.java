package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.TicketExpiredEvent;
import com.tickets.msticketing.model.Reservation;
import com.tickets.msticketing.model.ReservationStatus;
import com.tickets.msticketing.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Processes individual reservation expirations in an isolated transaction (REQUIRES_NEW).
 * Extracted as a separate Spring bean to ensure @Transactional proxy is applied correctly
 * (avoids self-invocation problem from ExpirationService).
 *
 * Each item is committed independently: a failure in one reservation does not
 * roll back the entire batch (RN spec: "cada reservation se procesa con @Transactional propio").
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationExpirationProcessor {

    private final ReservationRepository reservationRepository;
    private final RabbitMQPublisherService rabbitMQPublisherService;
    private final MsEventsIntegrationService msEventsIntegrationService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireSingle(Reservation reservation) {
        ReservationStatus previousStatus = reservation.getStatus();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        try {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservation.setUpdatedAt(now);
            reservationRepository.save(reservation);

            // Return inventory to ms-events
            try {
                msEventsIntegrationService.incrementTierQuota(
                    reservation.getEventId(),
                    reservation.getTierId(),
                    reservation.getId()
                );
            } catch (Exception ex) {
                log.error("ExpirationService: failed to increment quota for reservation={}: {}",
                    reservation.getId(), ex.getMessage());
            }

            TicketExpiredEvent event = new TicketExpiredEvent(
                reservation.getId(),
                reservation.getEventId(),
                reservation.getTierId(),
                reservation.getBuyerId(),
                now,
                "1.0"
            );
            rabbitMQPublisherService.publishTicketExpiredEvent(event);

            log.info("ExpirationService: expired reservation={} eventId={} tierId={} previousStatus={}",
                reservation.getId(), reservation.getEventId(), reservation.getTierId(), previousStatus);
        } catch (ObjectOptimisticLockingFailureException ex) {
            log.warn("ExpirationService: optimistic lock conflict on reservation={} — skipping (already modified)",
                reservation.getId());
            // REQUIRES_NEW rolls back for this item; no rethrow so the batch continues
        } catch (Exception ex) {
            log.error("ExpirationService: failed to expire reservation={} eventId={} tierId={} error={}",
                reservation.getId(), reservation.getEventId(), reservation.getTierId(), ex.getMessage(), ex);
            throw ex; // rethrow so REQUIRES_NEW rolls back this item's transaction
        }
    }
}
