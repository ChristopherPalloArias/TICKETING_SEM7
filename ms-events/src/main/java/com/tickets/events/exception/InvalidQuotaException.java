package com.tickets.events.exception;

public class InvalidQuotaException extends RuntimeException {
    public InvalidQuotaException(String message) {
        super(message);
    }
}