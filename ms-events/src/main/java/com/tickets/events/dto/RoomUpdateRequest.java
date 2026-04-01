package com.tickets.events.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomUpdateRequest(
    @NotBlank(message = "Room name must not be blank")
    String name,

    @NotNull(message = "maxCapacity must not be null")
    @Min(value = 1, message = "maxCapacity must be at least 1")
    Integer maxCapacity
) {}
