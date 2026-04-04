package com.tickets.events.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EventDetailResponse(
    UUID id,
    String title,
    String description,
    LocalDateTime date,
    Integer capacity,
    RoomResponse room,
    List<AvailableTierResponse> availableTiers,
    LocalDateTime created_at,
    // --- metadata fields ---
    String imageUrl,
    String subtitle,
    String location,
    String director,
    String castMembers,
    Integer duration,
    String tag,
    Boolean isLimited,
    Boolean isFeatured,
    Boolean enableSeats,
    String author
) {}
