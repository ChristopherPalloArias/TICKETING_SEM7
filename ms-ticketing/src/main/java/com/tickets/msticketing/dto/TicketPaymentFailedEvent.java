package com.tickets.msticketing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

public record TicketPaymentFailedEvent(
    @JsonProperty("reservationId")
    UUID reservationId,

    @JsonProperty("eventId")
    UUID eventId,

    @JsonProperty("tierId")
    UUID tierId,

    @JsonProperty("buyerId")
    UUID buyerId,

    @JsonProperty("motif")
    String motif,

    @JsonProperty("timestamp")
    LocalDateTime timestamp,

    @JsonProperty("version")
    String version,

    @JsonProperty("eventName")
    String eventName
) {
    public TicketPaymentFailedEvent(UUID reservationId, UUID eventId, UUID tierId, UUID buyerId,
                                     String motif, LocalDateTime timestamp, String version) {
        this(reservationId, eventId, tierId, buyerId, motif, timestamp, version, null);
    }
}
