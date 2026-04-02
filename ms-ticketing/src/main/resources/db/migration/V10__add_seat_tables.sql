-- V10__add_seat_tables.sql
-- Tabla de reservas temporales de asientos para ms-ticketing

CREATE TABLE IF NOT EXISTS seat_reservation (
    id UUID PRIMARY KEY,
    seat_id UUID NOT NULL,
    reservation_id UUID NOT NULL REFERENCES reservation(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    
    UNIQUE (reservation_id, seat_id),
    CONSTRAINT fk_seat_res_reservation FOREIGN KEY (reservation_id) 
        REFERENCES reservation(id) ON DELETE CASCADE
);

CREATE INDEX idx_seat_reservation_seat_id ON seat_reservation(seat_id);
CREATE INDEX idx_seat_reservation_reservation_id ON seat_reservation(reservation_id);
CREATE INDEX idx_seat_reservation_expires_at ON seat_reservation(expires_at);

-- Actualizar tabla ticket para incluir información de asientosfont
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS seat_id UUID;
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS seat_row VARCHAR(5);
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS seat_number INTEGER;
