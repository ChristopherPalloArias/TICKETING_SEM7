-- Create fraud_log table for audit trail and fraud detection
CREATE TABLE fraud_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempted_email VARCHAR(255) NOT NULL,
    reservation_id UUID NOT NULL,
    actual_owner_email VARCHAR(255),
    amount NUMERIC(10, 2),
    ip_address VARCHAR(50),
    user_agent TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DETECTED',
    description TEXT,
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    investigated_at TIMESTAMP,
    investigated_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient searching
CREATE INDEX idx_fraud_log_attempted_email ON fraud_log(attempted_email);
CREATE INDEX idx_fraud_log_reservation_id ON fraud_log(reservation_id);
CREATE INDEX idx_fraud_log_status ON fraud_log(status);
CREATE INDEX idx_fraud_log_attempted_at ON fraud_log(attempted_at);

-- Create combined index for recent fraud detection queries
CREATE INDEX idx_fraud_log_status_attempted_at ON fraud_log(status, attempted_at DESC);

-- Add comments
COMMENT ON TABLE fraud_log IS 'Log of detected fraud attempts and security incidents';
COMMENT ON COLUMN fraud_log.attempted_email IS 'Email address that attempted unauthorized action';
COMMENT ON COLUMN fraud_log.actual_owner_email IS 'Email of the legitimate owner of the resource';
COMMENT ON COLUMN fraud_log.status IS 'Investigation status: DETECTED, INVESTIGATING, CONFIRMED, FALSE_ALARM';
COMMENT ON COLUMN fraud_log.ip_address IS 'IP address from which the attempt originated';
