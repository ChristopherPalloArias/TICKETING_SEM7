package com.tickets.events.dto;

import com.tickets.events.model.SeatStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record SeatDTO(
    UUID id,
    UUID eventId,
    UUID tierId,
    String row,
    Integer number,
    SeatStatus status,
    LocalDateTime createdAt
) {}
