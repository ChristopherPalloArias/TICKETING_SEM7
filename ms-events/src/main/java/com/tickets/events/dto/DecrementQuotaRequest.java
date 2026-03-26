package com.tickets.events.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DecrementQuotaRequest(
    @NotNull(message = "decrementBy is required")
    @Min(value = 1, message = "decrementBy must be at least 1")
    Integer decrementBy
) {}
