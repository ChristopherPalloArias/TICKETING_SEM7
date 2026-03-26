package com.tickets.msticketing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

public record TicketExpiredEvent(
    @JsonProperty("reservationId")
    UUID reservationId,

    @JsonProperty("eventId")
    UUID eventId,

    @JsonProperty("tierId")
    UUID tierId,

    @JsonProperty("timestamp")
    LocalDateTime timestamp
) {}
