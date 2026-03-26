package com.tickets.events.exception;

public class QuotaExceedsCapacityException extends RuntimeException {
    private final Integer totalQuota;
    private final Integer eventCapacity;

    public QuotaExceedsCapacityException(String message, Integer totalQuota, Integer eventCapacity) {
        super(message);
        this.totalQuota = totalQuota;
        this.eventCapacity = eventCapacity;
    }

    public Integer getTotalQuota() {
        return totalQuota;
    }

    public Integer getEventCapacity() {
        return eventCapacity;
    }
}