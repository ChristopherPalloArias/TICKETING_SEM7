package com.tickets.msticketing.dto;

import java.util.List;

public record PaginatedTicketsResponse(
    List<TicketResponse> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
