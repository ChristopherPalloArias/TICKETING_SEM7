package com.tickets.events.exception;

public class InvalidTierConfigurationException extends RuntimeException {
    public InvalidTierConfigurationException(String message) {
        super(message);
    }
}