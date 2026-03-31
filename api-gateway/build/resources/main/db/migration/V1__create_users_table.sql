CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'BUYER')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Admin seed: contraseña configurable por variable de entorno (valor por defecto para dev)
-- La contraseña real se configura mediante ADMIN_PASSWORD_HASH en producción
-- Hash BCrypt de "Admin1234!" con cost 12
INSERT INTO users (id, email, password_hash, role)
VALUES (
    gen_random_uuid(),
    'admin@sofka.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCFOC6k8lqKfJnR9JlI8/Oa',
    'ADMIN'
) ON CONFLICT (email) DO NOTHING;
