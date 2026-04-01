package com.tickets.events.dto;

import com.tickets.events.model.EventStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record CancelEventResponse(
    UUID id,
    String title,
    EventStatus status,
    String cancellationReason,
    LocalDateTime updatedAt
) {}
