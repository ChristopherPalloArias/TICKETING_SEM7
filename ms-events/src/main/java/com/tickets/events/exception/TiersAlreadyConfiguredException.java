package com.tickets.events.exception;

public class TiersAlreadyConfiguredException extends RuntimeException {
    public TiersAlreadyConfiguredException(String message) {
        super(message);
    }
}