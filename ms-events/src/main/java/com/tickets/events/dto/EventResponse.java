package com.tickets.events.dto;

import com.tickets.events.model.EventStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record EventResponse(
    UUID id,
    UUID roomId,
    String title,
    String description,
    LocalDateTime date,
    Integer capacity,
    EventStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    String createdBy
) {}
