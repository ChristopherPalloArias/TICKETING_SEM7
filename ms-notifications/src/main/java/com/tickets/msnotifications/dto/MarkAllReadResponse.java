package com.tickets.msnotifications.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MarkAllReadResponse(
    @JsonProperty("updatedCount")
    int updatedCount
) {}
