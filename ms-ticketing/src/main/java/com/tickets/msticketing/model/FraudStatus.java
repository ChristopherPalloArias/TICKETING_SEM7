package com.tickets.msticketing.model;

/**
 * Enum representing the status of a fraud investigation
 */
public enum FraudStatus {
    DETECTED,      // Initial fraud detection triggered
    INVESTIGATING, // Under investigation by security team
    CONFIRMED,     // Confirmed as fraudulent activity
    FALSE_ALARM    // Investigation cleared, no fraud found
}
