package com.tickets.msticketing.exception;

public class TierQuotaExhaustedException extends RuntimeException {
    public TierQuotaExhaustedException(String message) {
        super(message);
    }
}
