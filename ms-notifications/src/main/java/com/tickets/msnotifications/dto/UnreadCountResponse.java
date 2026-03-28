package com.tickets.msnotifications.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UnreadCountResponse(
    @JsonProperty("unreadCount")
    long unreadCount
) {}
