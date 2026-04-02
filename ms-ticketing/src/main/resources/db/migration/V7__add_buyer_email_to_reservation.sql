-- Add buyer_email column to reservation table for security validation
ALTER TABLE reservation
ADD COLUMN buyer_email VARCHAR(255);

-- Create index for email lookups
CREATE INDEX idx_reservation_buyer_email ON reservation(buyer_email);

-- Add comment
COMMENT ON COLUMN reservation.buyer_email IS 'Email del comprador para validar propiedad en pagos y trazabilidad';
