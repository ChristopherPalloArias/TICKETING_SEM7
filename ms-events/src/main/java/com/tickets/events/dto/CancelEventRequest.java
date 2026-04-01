package com.tickets.events.dto;

import jakarta.validation.constraints.NotBlank;

public record CancelEventRequest(
    @NotBlank(message = "cancellationReason must not be blank") String cancellationReason
) {}
