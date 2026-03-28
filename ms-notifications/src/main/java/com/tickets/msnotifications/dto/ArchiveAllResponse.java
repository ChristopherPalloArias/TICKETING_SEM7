package com.tickets.msnotifications.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ArchiveAllResponse(
    @JsonProperty("archivedCount")
    int archivedCount
) {}
