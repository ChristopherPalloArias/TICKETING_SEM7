CREATE TYPE notification_type AS ENUM ('PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'RESERVATION_EXPIRED');
CREATE TYPE notification_status AS ENUM ('PROCESSED', 'FAILED');

CREATE TABLE notification (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL,
    event_id       UUID NOT NULL,
    tier_id        UUID NOT NULL,
    buyer_id       UUID NOT NULL,
    type           notification_type   NOT NULL,
    motif          VARCHAR(255)        NOT NULL,
    status         notification_status NOT NULL DEFAULT 'PROCESSED',
    created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_notification_reservation_type
    ON notification (reservation_id, type);

CREATE INDEX idx_notification_buyer_id
    ON notification (buyer_id);

CREATE INDEX idx_notification_created_at
    ON notification (created_at DESC);
