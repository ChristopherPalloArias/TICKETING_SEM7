package com.tickets.msticketing.exception;

public class ReservationExpiredException extends RuntimeException {
    public ReservationExpiredException(String message) {
        super(message);
    }
}
