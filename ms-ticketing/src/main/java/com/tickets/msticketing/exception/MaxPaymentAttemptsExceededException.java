package com.tickets.msticketing.exception;

public class MaxPaymentAttemptsExceededException extends RuntimeException {
    public MaxPaymentAttemptsExceededException(String message) {
        super(message);
    }
}
