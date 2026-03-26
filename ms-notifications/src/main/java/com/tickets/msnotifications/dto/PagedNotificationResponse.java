package com.tickets.msnotifications.dto;

import java.util.List;

public record PagedNotificationResponse(
    List<NotificationResponse> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
