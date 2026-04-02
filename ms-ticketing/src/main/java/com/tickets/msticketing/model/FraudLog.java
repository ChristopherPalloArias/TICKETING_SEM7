package com.tickets.msticketing.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "fraud_log", indexes = {
    @Index(name = "idx_fraud_log_attempted_email", columnList = "attempted_email"),
    @Index(name = "idx_fraud_log_reservation_id", columnList = "reservation_id"),
    @Index(name = "idx_fraud_log_status", columnList = "status"),
    @Index(name = "idx_fraud_log_attempted_at", columnList = "attempted_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FraudLog {

    @Id
    private UUID id;

    @Column(name = "attempted_email", nullable = false, length = 255)
    private String attemptedEmail;

    @Column(name = "reservation_id", nullable = false)
    private UUID reservationId;

    @Column(name = "actual_owner_email", length = 255)
    private String actualOwnerEmail;

    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FraudStatus status;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    @Column(name = "investigated_at")
    private LocalDateTime investigatedAt;

    @Column(name = "investigated_by", length = 255)
    private String investigatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        this.createdAt = now;
        this.updatedAt = now;
        if (this.attemptedAt == null) {
            this.attemptedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
