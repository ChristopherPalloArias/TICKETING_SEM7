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

    @JsonProperty("buyerId")
    UUID buyerId,

    @JsonProperty("timestamp")
    LocalDateTime timestamp,

    @JsonProperty("version")
    String version,

    @JsonProperty("motif")
    String motif,

    @JsonProperty("eventName")
    String eventName
) {
    public TicketExpiredEvent(UUID reservationId, UUID eventId, UUID tierId, UUID buyerId,
                               LocalDateTime timestamp, String version) {
        this(reservationId, eventId, tierId, buyerId, timestamp, version, null, null);
    }

    public TicketExpiredEvent(UUID reservationId, UUID eventId, UUID tierId, UUID buyerId,
                               LocalDateTime timestamp, String version, String motif) {
        this(reservationId, eventId, tierId, buyerId, timestamp, version, motif, null);
    }
}
