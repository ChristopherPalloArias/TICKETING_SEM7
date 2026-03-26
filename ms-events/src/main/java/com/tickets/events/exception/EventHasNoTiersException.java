package com.tickets.events.exception;

public class EventHasNoTiersException extends RuntimeException {
    public EventHasNoTiersException(String message) {
        super(message);
    }
}
