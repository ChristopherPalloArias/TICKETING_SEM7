package com.tickets.events.dto;

import com.tickets.events.model.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminEventDetailResponse(
    UUID id,
    String title,
    String description,
    LocalDateTime date,
    Integer capacity,
    EventStatus status,
    RoomResponse room,
    List<AvailableTierResponse> availableTiers,
    String imageUrl,
    String subtitle,
    String location,
    String director,
    String castMembers,
    Integer duration,
    String tag,
    Boolean isLimited,
    Boolean isFeatured,
    String author,
    String createdBy,
    LocalDateTime created_at,
    LocalDateTime updated_at,
    long ticketsSold,
    long activeReservations,
    BigDecimal estimatedRevenue
) {}
