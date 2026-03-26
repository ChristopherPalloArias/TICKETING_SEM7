package com.tickets.events.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "processed_idempotency_key")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessedIdempotencyKey {

    @Id
    @Column(name = "idempotency_key", length = 36)
    private String idempotencyKey;

    @Column(name = "tier_id", nullable = false)
    private UUID tierId;

    @Column(name = "response_payload", nullable = false, columnDefinition = "TEXT")
    private String responsePayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }
}
