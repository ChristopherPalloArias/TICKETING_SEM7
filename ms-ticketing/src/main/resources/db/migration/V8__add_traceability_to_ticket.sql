-- Add traceability fields to ticket table for audit trail
ALTER TABLE ticket
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN transaction_id VARCHAR(255),
ADD COLUMN paid_at TIMESTAMP;

-- Create indexes for efficient lookups
CREATE INDEX idx_ticket_paid_at ON ticket(paid_at);
CREATE INDEX idx_ticket_transaction_id ON ticket(transaction_id);

-- Add comment
COMMENT ON COLUMN ticket.payment_method IS 'Payment method used (MOCK, CREDIT_CARD, etc.)';
COMMENT ON COLUMN ticket.transaction_id IS 'Reference to payment processor transaction';
COMMENT ON COLUMN ticket.paid_at IS 'Timestamp when payment was confirmed (UTC)';
