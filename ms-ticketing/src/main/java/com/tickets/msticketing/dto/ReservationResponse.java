package com.tickets.msticketing.dto;

import com.tickets.msticketing.model.ReservationStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationResponse(
    UUID id,
    UUID eventId,
    UUID tierId,
    UUID buyerId,
    ReservationStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime validUntilAt
) {}
