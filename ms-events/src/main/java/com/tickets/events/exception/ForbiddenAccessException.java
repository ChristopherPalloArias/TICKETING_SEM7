package com.tickets.events.exception;

public class ForbiddenAccessException extends RuntimeException {
    public ForbiddenAccessException(String message) {
        super(message);
    }
}
