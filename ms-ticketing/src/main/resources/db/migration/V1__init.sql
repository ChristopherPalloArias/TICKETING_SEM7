CREATE TABLE IF NOT EXISTS reservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    tier_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'PAYMENT_FAILED', 'EXPIRED', 'CANCELLED')),
    payment_attempts INTEGER NOT NULL DEFAULT 0,
    valid_until_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TABLE IF NOT EXISTS ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL UNIQUE REFERENCES reservation(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL,
    event_id UUID NOT NULL,
    tier_id UUID NOT NULL,
    tier_type VARCHAR(20) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('VALID', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX idx_reservation_event_id ON reservation(event_id);
CREATE INDEX idx_reservation_tier_id ON reservation(tier_id);
CREATE INDEX idx_reservation_buyer_id ON reservation(buyer_id);
CREATE INDEX idx_reservation_status ON reservation(status);
CREATE INDEX idx_reservation_valid_until_at ON reservation(valid_until_at);

CREATE INDEX idx_ticket_buyer_id ON ticket(buyer_id);
CREATE INDEX idx_ticket_event_id ON ticket(event_id);
CREATE INDEX idx_ticket_reservation_id ON ticket(reservation_id);
