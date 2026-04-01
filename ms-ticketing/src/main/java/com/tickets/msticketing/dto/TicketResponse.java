package com.tickets.msticketing.dto;

import com.tickets.msticketing.model.TicketStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TicketResponse(
    UUID ticketId,
    UUID eventId,
    String eventTitle,
    LocalDateTime eventDate,
    String tier,
    BigDecimal pricePaid,
    TicketStatus status,
    LocalDateTime purchasedAt,
    String buyerEmail,
    UUID reservationId
) {}
