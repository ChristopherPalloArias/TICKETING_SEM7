package com.tickets.msticketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CreateReservationRequest(
    @NotNull(message = "eventId is required")
    UUID eventId,

    @NotNull(message = "tierId is required")
    UUID tierId,

    @NotNull(message = "buyerEmail is required")
    @Email(message = "buyerEmail must be a valid email address")
    String buyerEmail,

    @Size(min = 1, max = 100)
    List<UUID> seatIds
) {}

