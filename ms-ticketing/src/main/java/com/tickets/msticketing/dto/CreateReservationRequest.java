package com.tickets.msticketing.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateReservationRequest(
    @NotNull(message = "eventId is required")
    UUID eventId,

    @NotNull(message = "tierId is required")
    UUID tierId
) {}
