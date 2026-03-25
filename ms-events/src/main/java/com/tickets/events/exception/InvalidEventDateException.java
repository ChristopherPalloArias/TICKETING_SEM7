package com.tickets.events.exception;

public class InvalidEventDateException extends RuntimeException {
    public InvalidEventDateException(String message) {
        super(message);
    }
}
