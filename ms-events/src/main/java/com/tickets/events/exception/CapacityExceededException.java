package com.tickets.events.exception;

public class CapacityExceededException extends RuntimeException {
    private final Integer roomMaxCapacity;
    
    public CapacityExceededException(String message, Integer roomMaxCapacity) {
        super(message);
        this.roomMaxCapacity = roomMaxCapacity;
    }
    
    public Integer getRoomMaxCapacity() {
        return roomMaxCapacity;
    }
}
