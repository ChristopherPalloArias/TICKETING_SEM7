package com.tickets.events.exception;

public class UnauthorizedServiceException extends RuntimeException {
    public UnauthorizedServiceException(String message) {
        super(message);
    }
}
