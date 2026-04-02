package com.tickets.msticketing.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "reservation", indexes = {
    @Index(name = "idx_reservation_event_id", columnList = "event_id"),
    @Index(name = "idx_reservation_tier_id", columnList = "tier_id"),
    @Index(name = "idx_reservation_buyer_id", columnList = "buyer_id"),
    @Index(name = "idx_reservation_status", columnList = "status"),
    @Index(name = "idx_reservation_valid_until_at", columnList = "valid_until_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "tier_id", nullable = false)
    private UUID tierId;

    @Column(name = "buyer_id", nullable = false)
    private UUID buyerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReservationStatus status;

    @Column(name = "valid_until_at", nullable = false)
    private LocalDateTime validUntilAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "payment_attempts", nullable = false)
    @Builder.Default
    private Integer paymentAttempts = 0;

    @Column(name = "tier_type", length = 20)
    private String tierType;

    @Column(name = "buyer_email", length = 255)
    private String buyerEmail;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        this.createdAt = now;
        this.updatedAt = now;
        if (this.validUntilAt == null) {
            this.validUntilAt = now.plusMinutes(10);
        }
        if (this.paymentAttempts == null) {
            this.paymentAttempts = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
