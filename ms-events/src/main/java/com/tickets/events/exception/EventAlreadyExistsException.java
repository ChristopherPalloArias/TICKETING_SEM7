package com.tickets.events.exception;

public class EventAlreadyExistsException extends RuntimeException {
    public EventAlreadyExistsException(String message) {
        super(message);
    }
}
