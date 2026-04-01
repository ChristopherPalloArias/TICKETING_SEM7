package com.tickets.events.dto;

public record AdminStatsResponse(
    long totalEvents,
    long publishedEvents,
    long totalTicketsSold,
    long activeReservations
) {}
