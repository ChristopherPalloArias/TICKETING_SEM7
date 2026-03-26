package com.tickets.msticketing.dto;

import com.tickets.msticketing.model.ReservationStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record GetReservationResponse(
    UUID id,
    UUID eventId,
    UUID tierId,
    ReservationStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime validUntilAt
) {}
