package com.tickets.msticketing.dto;

import java.util.UUID;

public record SeatDTO(
    UUID id,
    String row,
    Integer number,
    String status
) {}
