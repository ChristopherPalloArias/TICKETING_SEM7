package com.tickets.events.exception;

public class InvalidEventStateException extends RuntimeException {
    private final String currentStatus;

    public InvalidEventStateException(String message, String currentStatus) {
        super(message);
        this.currentStatus = currentStatus;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }
}