-- HU-05: Composite index for scheduled expiration query (status + valid_until_at)
CREATE INDEX IF NOT EXISTS idx_reservation_status_expiry
    ON reservation(status, valid_until_at);
