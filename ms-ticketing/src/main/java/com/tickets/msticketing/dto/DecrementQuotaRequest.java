package com.tickets.msticketing.dto;

import java.util.UUID;

public record DecrementQuotaRequest(
    Integer decrementBy
) {}
