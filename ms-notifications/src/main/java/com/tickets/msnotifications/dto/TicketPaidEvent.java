package com.tickets.msnotifications.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TicketPaidEvent(
    @JsonProperty("reservationId")
    UUID reservationId,

    @JsonProperty("eventId")
    UUID eventId,

    @JsonProperty("tierId")
    UUID tierId,

    @JsonProperty("buyerId")
    UUID buyerId,

    @JsonProperty("amount")
    BigDecimal amount,

    @JsonProperty("timestamp")
    LocalDateTime timestamp,

    @JsonProperty("version")
    String version,

    @JsonProperty("eventName")
    String eventName
) {}
