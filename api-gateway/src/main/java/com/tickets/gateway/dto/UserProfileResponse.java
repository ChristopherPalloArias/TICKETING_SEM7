package com.tickets.gateway.dto;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    String email,
    String role,
    Instant createdAt
) {}
