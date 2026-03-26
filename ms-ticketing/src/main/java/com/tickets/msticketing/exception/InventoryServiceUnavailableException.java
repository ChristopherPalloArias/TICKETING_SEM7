package com.tickets.msticketing.exception;

public class InventoryServiceUnavailableException extends RuntimeException {
    public InventoryServiceUnavailableException(String message) {
        super(message);
    }
}
