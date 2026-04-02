package com.tickets.events.dto;

import com.tickets.events.model.SeatStatus;
import java.util.UUID;

public record SeatDTO(
    UUID id,
    String row,
    Integer number,
    SeatStatus status
) {}
