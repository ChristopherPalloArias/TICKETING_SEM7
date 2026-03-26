package com.tickets.events.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RoomResponse(
    UUID id,
    String name,
    Integer maxCapacity,
    LocalDateTime created_at,
    LocalDateTime updated_at
) {}
