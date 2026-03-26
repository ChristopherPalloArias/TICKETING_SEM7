package com.tickets.events.dto;

import com.tickets.events.model.TierType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TierCreateRequest(
    @NotNull(message = "tierType must not be null")
    TierType tierType,

    @NotNull(message = "price must not be null")
    @DecimalMin(value = "0.01", message = "price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "price must have at most 8 integer digits and 2 decimals")
    BigDecimal price,

    @NotNull(message = "quota must not be null")
    @Min(value = 1, message = "quota must be greater than 0")
    Integer quota,

    @FutureOrPresent(message = "validFrom must be present or future")
    LocalDateTime validFrom,

    @FutureOrPresent(message = "validUntil must be present or future")
    LocalDateTime validUntil
) {}