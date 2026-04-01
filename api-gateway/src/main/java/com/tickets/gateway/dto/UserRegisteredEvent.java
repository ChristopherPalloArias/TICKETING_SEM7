package com.tickets.gateway.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserRegisteredEvent(
    UUID userId,
    String email,
    String role,
    LocalDateTime registeredAt
) {}
