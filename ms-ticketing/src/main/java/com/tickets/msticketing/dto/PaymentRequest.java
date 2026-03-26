package com.tickets.msticketing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentRequest(
    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than 0")
    BigDecimal amount,

    @NotNull(message = "paymentMethod is required")
    String paymentMethod,

    @NotNull(message = "status is required")
    String status
) {}
