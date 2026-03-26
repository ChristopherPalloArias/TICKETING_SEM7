package com.tickets.msticketing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EventDetailResponse(
    @JsonProperty("id") UUID id,
    @JsonProperty("title") String title,
    @JsonProperty("description") String description,
    @JsonProperty("date") LocalDateTime date,
    @JsonProperty("capacity") Integer capacity,
    @JsonProperty("status") String status,
    @JsonProperty("availableTiers") List<AvailableTierResponse> availableTiers
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AvailableTierResponse(
        @JsonProperty("id") UUID id,
        @JsonProperty("tierType") String tierType,
        @JsonProperty("price") java.math.BigDecimal price,
        @JsonProperty("quota") Integer quota,
        @JsonProperty("isAvailable") Boolean isAvailable
    ) {}
}
