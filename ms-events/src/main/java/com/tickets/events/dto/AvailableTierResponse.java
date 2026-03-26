package com.tickets.events.dto;

import com.tickets.events.model.TierType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AvailableTierResponse(
    UUID id,
    TierType tierType,
    BigDecimal price,
    Integer quota,
    LocalDateTime validFrom,
    LocalDateTime validUntil,
    Boolean isAvailable,
    String reason
) {}
