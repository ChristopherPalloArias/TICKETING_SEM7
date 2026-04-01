-- V9: Outbox pattern para ms-events
-- Garantiza entrega de mensajes RabbitMQ aunque el broker esté temporalmente caído.
-- Los registros con published=FALSE son procesados por OutboxPublisherScheduler (cada 5s).

CREATE TABLE IF NOT EXISTS outbox (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    event_type  VARCHAR(100) NOT NULL,
    routing_key VARCHAR(100) NOT NULL,
    payload     TEXT         NOT NULL,
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT pk_events_outbox PRIMARY KEY (id)
);

-- Índice para que el scheduler lea eficientemente solo los pendientes
CREATE INDEX IF NOT EXISTS idx_events_outbox_published ON outbox (published)
    WHERE published = FALSE;
