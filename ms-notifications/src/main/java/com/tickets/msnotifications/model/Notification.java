package com.tickets.msnotifications.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "notification",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_notification_reservation_type",
        columnNames = {"reservation_id", "type"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "reservation_id", nullable = false, columnDefinition = "uuid")
    private UUID reservationId;

    @Column(name = "event_id", nullable = false, columnDefinition = "uuid")
    private UUID eventId;

    @Column(name = "tier_id", nullable = false, columnDefinition = "uuid")
    private UUID tierId;

    @Column(name = "buyer_id", nullable = false, columnDefinition = "uuid")
    private UUID buyerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private NotificationType type;

    @Column(name = "motif", nullable = false, length = 255)
    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PROCESSED;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
