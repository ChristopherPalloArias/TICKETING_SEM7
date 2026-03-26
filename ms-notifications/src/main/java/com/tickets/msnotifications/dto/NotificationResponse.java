package com.tickets.msnotifications.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    @JsonProperty("id")
    UUID id,

    @JsonProperty("reservationId")
    UUID reservationId,

    @JsonProperty("eventId")
    UUID eventId,

    @JsonProperty("tierId")
    UUID tierId,

    @JsonProperty("buyerId")
    UUID buyerId,

    @JsonProperty("type")
    String type,

    @JsonProperty("motif")
    String motif,

    @JsonProperty("status")
    String status,

    @JsonProperty("createdAt")
    Instant createdAt
) {}
