package com.tickets.msnotifications.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventCancelledMessage(
    @JsonProperty("eventId")
    UUID eventId,

    @JsonProperty("eventTitle")
    String eventTitle,

    @JsonProperty("cancellationReason")
    String cancellationReason,

    @JsonProperty("cancelledAt")
    LocalDateTime cancelledAt
) {}
