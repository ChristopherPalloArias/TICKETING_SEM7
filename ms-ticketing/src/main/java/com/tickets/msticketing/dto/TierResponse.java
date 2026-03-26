package com.tickets.msticketing.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TierResponse(
    UUID id,
    String tierType,
    Integer quota,
    BigDecimal price,
    Long version
) {}
