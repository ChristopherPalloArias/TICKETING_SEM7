package com.tickets.msticketing.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SeatAvailabilityResponse(
    List<SeatDTO> available,
    List<SeatDTO> unavailable,
    LocalDateTime timestamp
) {}
