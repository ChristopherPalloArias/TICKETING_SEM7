package com.tickets.events.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record IncrementQuotaRequest(
    @NotNull(message = "incrementBy must not be null")
    @Min(value = 1, message = "incrementBy must be at least 1")
    Integer incrementBy
) {}
