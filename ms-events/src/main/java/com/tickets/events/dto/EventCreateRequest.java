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
    Integer capacity,
    // --- metadata fields (all optional) ---
    @Size(max = 500, message = "imageUrl: size must be between 0 and 500")
    String imageUrl,
    @Size(max = 300, message = "subtitle: size must be between 0 and 300")
    String subtitle,
    @Size(max = 300, message = "location: size must be between 0 and 300")
    String location,
    @Size(max = 200, message = "director: size must be between 0 and 200")
    String director,
    @Size(max = 500, message = "castMembers: size must be between 0 and 500")
    String castMembers,
    @Min(value = 1, message = "duration: must be greater than or equal to 1")
    Integer duration,
    @Size(max = 100, message = "tag: size must be between 0 and 100")
    String tag,
    Boolean isLimited,
    Boolean isFeatured,
    @Size(max = 200, message = "author: size must be between 0 and 200")
    String author,
    // --- seat configuration fields (optional) ---
    Boolean enableSeats,
    @Min(value = 1, message = "seatsPerTier: must be at least 1")
    @Max(value = 200, message = "seatsPerTier: must not exceed 200")
    Integer seatsPerTier,
    @Min(value = 1, message = "seatsPerRow: must be at least 1")
    @Max(value = 20, message = "seatsPerRow: must not exceed 20")
    Integer seatsPerRow
) {}
