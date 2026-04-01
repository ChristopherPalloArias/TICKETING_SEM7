package com.tickets.events.exception;

public class EventUpdateNotAllowedException extends RuntimeException {
    public EventUpdateNotAllowedException(String message) {
        super(message);
    }
}
