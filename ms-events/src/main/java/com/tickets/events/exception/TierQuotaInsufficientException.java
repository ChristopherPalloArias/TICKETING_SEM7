package com.tickets.events.exception;

public class TierQuotaInsufficientException extends RuntimeException {
    public TierQuotaInsufficientException(String message) {
        super(message);
    }
}
