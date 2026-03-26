package com.tickets.events.dto;

import com.tickets.events.model.TierType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TierResponse(
    UUID id,
    TierType tierType,
    BigDecimal price,
    Integer quota,
    LocalDateTime validFrom,
    LocalDateTime validUntil,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}