-- V10__add_seat_table.sql
-- Tabla de asientos física para ms-events

CREATE TABLE IF NOT EXISTS seat (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES tier(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    version BIGINT NOT NULL DEFAULT 0,
    
    UNIQUE (event_id, tier_id, row_number, seat_number),
    CONSTRAINT fk_seat_event FOREIGN KEY (event_id) 
        REFERENCES event(id) ON DELETE CASCADE,
    CONSTRAINT fk_seat_tier FOREIGN KEY (tier_id) 
        REFERENCES tier(id) ON DELETE CASCADE
);

CREATE INDEX idx_seat_event_tier ON seat(event_id, tier_id);
CREATE INDEX idx_seat_status ON seat(status);
CREATE INDEX idx_seat_event_status ON seat(event_id, status);
