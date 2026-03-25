package com.tickets.events.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.UUID;

public record EventCreateRequest(
    @NotNull(message = "roomId: must not be null")
    UUID roomId,
    
    @NotBlank(message = "title: must not be blank")
    @Size(min = 1, max = 150, message = "title: size must be between 1 and 150")
    String title,
    
    @NotBlank(message = "description: must not be blank")
    @Size(min = 1, max = 1000, message = "description: size must be between 1 and 1000")
    String description,
    
    @NotNull(message = "date: must not be null")
    @FutureOrPresent(message = "date: must be a future date")
    LocalDateTime date,
    
    @NotNull(message = "capacity: must not be null")
    @Min(value = 1, message = "capacity: must be at least 1")
    Integer capacity
) {}
