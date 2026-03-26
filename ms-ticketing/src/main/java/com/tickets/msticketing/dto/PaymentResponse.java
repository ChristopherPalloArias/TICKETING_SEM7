package com.tickets.msticketing.dto;

import com.tickets.msticketing.model.ReservationStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
    UUID reservationId,
    ReservationStatus status,
    UUID ticketId,
    String message,
    TicketResponse ticket,
    LocalDateTime timestamp
) {}
