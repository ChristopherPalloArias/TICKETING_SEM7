package com.tickets.msticketing.dto;

import com.tickets.msticketing.model.TicketStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TicketResponse(
    UUID id,
    UUID reservationId,
    UUID eventId,
    UUID tierId,
    String tierType,
    BigDecimal price,
    TicketStatus status,
    LocalDateTime createdAt
) {}
