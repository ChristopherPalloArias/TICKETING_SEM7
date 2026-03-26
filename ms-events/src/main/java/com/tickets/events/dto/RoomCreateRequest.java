package com.tickets.events.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomCreateRequest(
    @NotBlank(message = "Room name cannot be blank")
    String name,

    @NotNull(message = "Max capacity must not be null")
    @Min(value = 1, message = "Max capacity must be at least 1")
    Integer maxCapacity
) {}
