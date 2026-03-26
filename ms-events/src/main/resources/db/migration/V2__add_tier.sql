CREATE TABLE tier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    tier_type VARCHAR(20) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    quota INTEGER NOT NULL CHECK (quota > 0),
    valid_from TIMESTAMP NULL,
    valid_until TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    UNIQUE (event_id, tier_type),
    CONSTRAINT valid_vigencia CHECK (
        valid_from IS NULL OR valid_until IS NULL OR valid_from < valid_until
    ),
    CONSTRAINT early_bird_dates_consistency CHECK (
        tier_type != 'EARLY_BIRD' OR
        (valid_from IS NOT NULL AND valid_until IS NOT NULL) OR
        (valid_from IS NULL AND valid_until IS NULL)
    )
);

CREATE INDEX idx_tier_event_id ON tier(event_id);
CREATE INDEX idx_tier_type ON tier(tier_type);