CREATE TABLE IF NOT EXISTS processed_idempotency_key (
    idempotency_key VARCHAR(36)  NOT NULL,
    tier_id         UUID         NOT NULL,
    response_payload TEXT        NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT pk_processed_idempotency_key PRIMARY KEY (idempotency_key)
);
