package com.tickets.events.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record EventUpdateRequest(
    String title,
    String subtitle,
    String description,
    LocalDateTime date,
    Integer capacity,
    UUID roomId,
    String imageUrl,
    String director,
    String castMembers,
    String location
) {}
