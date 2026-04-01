package com.tickets.msticketing.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserRegisteredEvent(
    UUID userId,
    String email,
    String role,
    LocalDateTime registeredAt
) {}
