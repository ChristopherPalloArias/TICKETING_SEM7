package com.tickets.events.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventCancelledMessage(
    UUID eventId,
    String eventTitle,
    String cancellationReason,
    LocalDateTime cancelledAt
) {}
