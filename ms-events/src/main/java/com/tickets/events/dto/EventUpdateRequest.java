package com.tickets.events.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventUpdateRequest(
    @Size(min = 1, max = 150, message = "title: size must be between 1 and 150")
    String title,
    @Size(min = 1, max = 300, message = "subtitle: size must be between 1 and 300")
    String subtitle,
    @Size(min = 1, max = 1000, message = "description: size must be between 1 and 1000")
    String description,
    @Future(message = "date: must be a future date")
    LocalDateTime date,
    @Min(value = 1, message = "capacity: must be at least 1")
    Integer capacity,
    UUID roomId,
    @Size(max = 500, message = "imageUrl: size must be at most 500")
    String imageUrl,
    @Size(max = 200, message = "director: size must be at most 200")
    String director,
    @Size(max = 500, message = "castMembers: size must be at most 500")
    String castMembers,
    @Size(max = 300, message = "location: size must be at most 300")
    String location
) {}
