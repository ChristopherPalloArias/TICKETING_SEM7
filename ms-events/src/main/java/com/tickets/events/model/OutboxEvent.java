package com.tickets.events.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Entidad del patrón Outbox para ms-events.
 *
 * <p>Cada mensaje de dominio que deba publicarse a RabbitMQ se persiste primero
 * en esta tabla dentro de la misma transacción de negocio. El {@code OutboxPublisherScheduler}
 * lee periódicamente los eventos con {@code published=false}, los envía al broker
 * y los marca como publicados. Esto garantiza consistencia eventual entre la BD
 * y el bus de eventos aunque el broker esté temporalmente caído.</p>
 */
@Entity
@Table(
        name = "outbox",
        indexes = { @Index(name = "idx_events_outbox_published", columnList = "published") }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Tipo semántico del evento (ej: "event.cancelled"). */
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    /** Routing key usada al publicar en el exchange de RabbitMQ. */
    @Column(name = "routing_key", nullable = false, length = 100)
    private String routingKey;

    /** Payload serializado en JSON. */
    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    /** {@code false} mientras no se haya publicado al broker. */
    @Builder.Default
    @Column(name = "published", nullable = false)
    private Boolean published = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }
}
