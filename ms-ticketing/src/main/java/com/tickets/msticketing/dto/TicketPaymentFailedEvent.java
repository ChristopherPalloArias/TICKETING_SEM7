package com.tickets.msticketing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

public record TicketPaymentFailedEvent(
    @JsonProperty("reservationId")
    UUID reservationId,

    @JsonProperty("motif")
    String motif,

    @JsonProperty("timestamp")
    LocalDateTime timestamp
) {}
