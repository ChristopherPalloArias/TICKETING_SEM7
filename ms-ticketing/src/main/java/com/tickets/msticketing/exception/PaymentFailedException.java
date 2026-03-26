package com.tickets.msticketing.exception;

public class PaymentFailedException extends RuntimeException {
    private final String reservationId;

    public PaymentFailedException(String message, String reservationId) {
        super(message);
        this.reservationId = reservationId;
    }

    public String getReservationId() {
        return reservationId;
    }
}
