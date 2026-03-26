package com.tickets.msticketing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TierResponse(
    UUID id,
    String tierType,
    Integer quota,
    BigDecimal price,
    Long version
) {}
