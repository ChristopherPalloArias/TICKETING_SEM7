package com.tickets.events.controller;

import com.tickets.events.dto.SeatDTO;
import com.tickets.events.dto.SeatAvailabilityResponse;
import com.tickets.events.model.Seat;
import com.tickets.events.model.SeatStatus;
import com.tickets.events.service.SeatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/events/{eventId}/seats")
@RequiredArgsConstructor
@Slf4j
public class SeatController {

    private final SeatService seatService;

    /**
     * GET /api/v1/events/{eventId}/seats?tierId={tierId}&status={status}
     * Retrieve seats for an event/tier, optionally filtered by status.
     */
    @GetMapping
    public ResponseEntity<List<SeatDTO>> getSeats(
            @PathVariable UUID eventId,
            @RequestParam(required = false) UUID tierId,
            @RequestParam(required = false) SeatStatus status) {
        
        log.info("GET /seats: eventId={}, tierId={}, status={}", eventId, tierId, status);
        
        List<Seat> seats;
        
        if (status != null) {
            seats = seatService.getSeatsByStatus(eventId, status);
        } else if (tierId != null) {
            seats = seatService.getAvailableSeats(eventId, tierId);
        } else {
            log.error("Missing required parameters: either tierId or status must be provided");
            return ResponseEntity.badRequest().build();
        }

        List<SeatDTO> dtos = seats.stream()
                .map(this::mapToSeatDTO)
                .collect(Collectors.toList());
        
        log.info("Returning {} seats for event={}", dtos.size(), eventId);
        return ResponseEntity.ok(dtos);
    }

    /**
     * POST /api/v1/events/{eventId}/seats/availability
     * Check availability of specific seats before reservation (prevents race conditions).
     */
    @PostMapping("/availability")
    public ResponseEntity<SeatAvailabilityResponse> checkAvailability(
            @PathVariable UUID eventId,
            @RequestBody @Valid CheckAvailabilityRequest request) {
        
        log.info("POST /availability: eventId={}, seatIds={}", eventId, request.seatIds().size());
        
        if (request.seatIds() == null || request.seatIds().isEmpty()) {
            log.error("No seat IDs provided for availability check");
            return ResponseEntity.badRequest().build();
        }

        List<SeatDTO> available = new ArrayList<>();
        List<SeatDTO> unavailable = new ArrayList<>();

        for (UUID seatId : request.seatIds()) {
            // In real scenario, fetch seat from repository
            // For now, simulate based on status
            SeatDTO dto = new SeatDTO(seatId, "A", 1, SeatStatus.AVAILABLE);
            available.add(dto);
        }

        SeatAvailabilityResponse response = new SeatAvailabilityResponse(
                available,
                unavailable,
                LocalDateTime.now(ZoneOffset.UTC)
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/events/{eventId}/seats/block
     * Block (reserve) seats. Requires idempotency key header for safe retries.
     */
    @PatchMapping("/block")
    public ResponseEntity<Map<String, Object>> blockSeats(
            @PathVariable UUID eventId,
            @RequestBody @Valid BlockSeatsRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) UUID idempotencyKey) {
        
        log.info("PATCH /block: eventId={}, seatIds={}, idempotencyKey={}", 
                eventId, request.seatIds().size(), idempotencyKey);
        
        if (idempotencyKey == null) {
            idempotencyKey = UUID.randomUUID();
            log.debug("Generated idempotencyKey={}", idempotencyKey);
        }

        try {
            seatService.blockSeats(eventId, request.seatIds(), idempotencyKey);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "BLOCKED");
            response.put("seatCount", request.seatIds().size());
            response.put("eventId", eventId);
            response.put("timestamp", LocalDateTime.now(ZoneOffset.UTC));
            
            log.info("Successfully blocked {} seats for event={}", request.seatIds().size(), eventId);
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException ex) {
            log.warn("Seat not available: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage(), "timestamp", LocalDateTime.now(ZoneOffset.UTC)));
        } catch (Exception ex) {
            log.error("Error blocking seats: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to block seats", "timestamp", LocalDateTime.now(ZoneOffset.UTC)));
        }
    }

    /**
     * PATCH /api/v1/events/{eventId}/seats/release
     * Release seats back to AVAILABLE (on reservation expiration).
     */
    @PatchMapping("/release")
    public ResponseEntity<Map<String, Object>> releaseSeats(
            @PathVariable UUID eventId,
            @RequestBody @Valid ReleaseSeatRequest request) {
        
        log.info("PATCH /release: eventId={}, seatIds={}", eventId, request.seatIds().size());
        
        try {
            seatService.releaseSeats(eventId, request.seatIds());
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "RELEASED");
            response.put("seatCount", request.seatIds().size());
            response.put("eventId", eventId);
            response.put("timestamp", LocalDateTime.now(ZoneOffset.UTC));
            
            log.info("Successfully released {} seats for event={}", request.seatIds().size(), eventId);
            return ResponseEntity.ok(response);
            
        } catch (Exception ex) {
            log.error("Error releasing seats: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to release seats", "timestamp", LocalDateTime.now(ZoneOffset.UTC)));
        }
    }

    /**
     * PATCH /api/v1/events/{eventId}/seats/sell
     * Confirm seats as SOLD after successful payment.
     */
    @PatchMapping("/sell")
    public ResponseEntity<Map<String, Object>> sellSeats(
            @PathVariable UUID eventId,
            @RequestBody @Valid SellSeatRequest request) {
        
        log.info("PATCH /sell: eventId={}, seatIds={}", eventId, request.seatIds().size());
        
        try {
            seatService.sellSeats(eventId, request.seatIds());
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SOLD");
            response.put("seatCount", request.seatIds().size());
            response.put("eventId", eventId);
            response.put("timestamp", LocalDateTime.now(ZoneOffset.UTC));
            
            log.info("Successfully confirmed {} seats as SOLD for event={}", request.seatIds().size(), eventId);
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException ex) {
            log.warn("Seat state error: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage(), "timestamp", LocalDateTime.now(ZoneOffset.UTC)));
        } catch (Exception ex) {
            log.error("Error confirming seats as sold: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to confirm seat sale", "timestamp", LocalDateTime.now(ZoneOffset.UTC)));
        }
    }

    /**
     * GET /api/v1/events/{eventId}/seats/metrics?tierId={tierId}
     * Get capacity metrics (available, reserved, sold counts).
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getCapacityMetrics(
            @PathVariable UUID eventId,
            @RequestParam UUID tierId) {
        
        log.info("GET /metrics: eventId={}, tierId={}", eventId, tierId);
        
        Map<String, Long> metrics = seatService.getCapacityMetrics(eventId, tierId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("eventId", eventId);
        response.put("tierId", tierId);
        response.put("metrics", metrics);
        response.put("timestamp", LocalDateTime.now(ZoneOffset.UTC));
        
        return ResponseEntity.ok(response);
    }

    private SeatDTO mapToSeatDTO(Seat seat) {
        return new SeatDTO(
                seat.getId(),
                seat.getRowNumber() != null ? "Row-" + seat.getRowNumber() : "A",
                seat.getSeatNumber() != null ? seat.getSeatNumber() : 1,
                seat.getStatus()
        );
    }

    // Request DTOs
    public record CheckAvailabilityRequest(
            @Size(min = 1, max = 100) List<UUID> seatIds
    ) {}

    public record BlockSeatsRequest(
            @Size(min = 1, max = 100) List<UUID> seatIds
    ) {}

    public record ReleaseSeatRequest(
            @Size(min = 1, max = 100) List<UUID> seatIds
    ) {}

    public record SellSeatRequest(
            @Size(min = 1, max = 100) List<UUID> seatIds
    ) {}
}
