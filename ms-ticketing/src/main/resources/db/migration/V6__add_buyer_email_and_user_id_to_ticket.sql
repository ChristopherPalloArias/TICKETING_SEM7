-- Migración V6: Agregar buyer_email y user_id a tabla ticket
-- Permite asociar tickets anónimos con usuarios registrados (HU-TKT-02)
-- Almacena email del comprador para búsqueda en asociación (HU-TKT-01)

-- Agregar columna buyer_email para registrar email del comprador
ALTER TABLE ticket
ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);

-- Agregar columna user_id para asociar ticket con usuario autenticado
-- NULL cuando es compra anónima
-- Se actualiza cuando usuario se registra con el mismo email
ALTER TABLE ticket
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Índice para búsqueda rápida en asociación de tickets anónimos
CREATE INDEX IF NOT EXISTS idx_ticket_buyer_email ON ticket(buyer_email);

-- Índice para filtrado de tickets por usuario autenticado
CREATE INDEX IF NOT EXISTS idx_ticket_user_id ON ticket(user_id);

-- Índice combinado para búsqueda eficiente en asociación
-- Buscar tickets sin usuario asociado por email
CREATE INDEX IF NOT EXISTS idx_ticket_buyer_email_user_id ON ticket(buyer_email, user_id) 
WHERE user_id IS NULL;
