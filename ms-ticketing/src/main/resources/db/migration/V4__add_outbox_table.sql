CREATE TABLE IF NOT EXISTS outbox (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    event_type   VARCHAR(100) NOT NULL,
    routing_key  VARCHAR(100) NOT NULL,
    payload      TEXT         NOT NULL,
    published    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT pk_outbox PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_outbox_published ON outbox (published);
