package com.tickets.events.dto;

import java.util.List;
import java.util.UUID;

public record TierConfigurationResponse(
    UUID eventId,
    List<TierResponse> tiers
) {}