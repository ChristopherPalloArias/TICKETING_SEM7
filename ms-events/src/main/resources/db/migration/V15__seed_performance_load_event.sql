-- ============================================================
-- V15__seed_performance_load_event.sql
-- Propósito: crear inventario dedicado al entorno de performance
-- para que k6 load-reservations pueda correr limpio los 7m30s
-- sin agotar los seats de los eventos funcionales de negocio.
--
-- Cálculo de inventario:
--   Perfil k6 PERF-001 (ramping-arrival-rate):
--     Stage 1 ramp 0→15 (1m):  avg 7.5 req/s ×  60s =    450 seats
--     Stage 2 hold   15 (2m):       15 req/s × 120s =  1.800 seats
--     Stage 3 ramp 15→30 (1m): avg 22.5 req/s ×  60s =  1.350 seats
--     Stage 4 hold   30 (3m):  [SLA WINDOW] 30 req/s × 180s =  5.400 seats  ← crítico
--     Stage 5 ramp 30→0 (30s): avg 15.0 req/s ×  30s =    450 seats
--     ─────────────────────────────────────────────────────────────────
--     TOTAL TEÓRICO                                       9.450 seats
--
--   Mínimo absoluto para la ventana SLA (stage 4):       5.400 seats
--   Mínimo recomendado para perfil completo (stages 1-5): 9.500 seats
--   Este script siembra:  9.500 GENERAL + 500 VIP = 10.000 seats (margen +5%)
--
-- Aislamiento de Karate:
--   • El evento se crea con un título único 'k6 Performance Load Test'
--   • Ningún test funcional de Karate debería referenciar ese título
--   • El endpoint POST /testability/performance/reset NO cambia:
--     'UPDATE seat SET status = AVAILABLE' ahora resetea también estos seats
--   • El endpoint GET /testability/performance/inventory devuelve más filas
--     (adición pura, no rompe contratos)
--   • La lógica de negocio de reservas, pagos y eventos no se altera
-- ============================================================

-- ── 1. Sala dedicada a performance ───────────────────────────
INSERT INTO room (id, name, max_capacity, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'Performance Test Arena',
    10000,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
WHERE NOT EXISTS (
    SELECT 1 FROM room WHERE name = 'Performance Test Arena'
);

-- ── 2. Evento de performance (PUBLISHED, enable_seats = true) ─
INSERT INTO event (
    id, room_id, title, description, date, capacity, status, created_by,
    image_url, subtitle, location, director, cast_members, duration,
    tag, is_limited, is_featured, enable_seats,
    created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM room WHERE name = 'Performance Test Arena'),
    'k6 Performance Load Test',
    'Evento dedicado exclusivamente al entorno de performance. No usar en demos ni funcionales.',
    NOW() + INTERVAL '365 days',
    10000,
    'PUBLISHED',
    'performance-seed',
    'https://picsum.photos/seed/perf/1200/800',
    'k6 Load Test Event',
    'PERFORMANCE ENVIRONMENT',
    'k6 runner',
    'Virtual Users',
    480,
    'PERFORMANCE_TEST',
    false,
    false,
    true,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
WHERE NOT EXISTS (
    SELECT 1 FROM event WHERE title = 'k6 Performance Load Test'
);

-- ── 3. Tiers del evento de performance ───────────────────────
-- GENERAL: cubre el perfil completo de k6 (9.500 seats)
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM event WHERE title = 'k6 Performance Load Test'),
    'GENERAL',
    10.00,
    10000,
    NULL,
    NULL,
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
WHERE NOT EXISTS (
    SELECT 1 FROM tier
    WHERE event_id = (SELECT id FROM event WHERE title = 'k6 Performance Load Test')
    AND tier_type = 'GENERAL'
);

-- VIP: inventario secundario (500 seats, cubre smoke + buffer)
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM event WHERE title = 'k6 Performance Load Test'),
    'VIP',
    20.00,
    1000,
    NULL,
    NULL,
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
WHERE NOT EXISTS (
    SELECT 1 FROM tier
    WHERE event_id = (SELECT id FROM event WHERE title = 'k6 Performance Load Test')
    AND tier_type = 'VIP'
);

-- ── 4. Seats GENERAL: 9.500 seats (95 filas × 100 columnas) ──
-- Cubre el perfil completo de 7m30s a 30 req/s + margen.
INSERT INTO seat (id, event_id, tier_id, row_number, seat_number, status, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM event WHERE title = 'k6 Performance Load Test'),
    (SELECT id FROM tier
        WHERE event_id = (SELECT id FROM event WHERE title = 'k6 Performance Load Test')
        AND tier_type = 'GENERAL'),
    (n - 1) / 100 + 1,       -- row_number: 1-95
    (n - 1) % 100 + 1,       -- seat_number: 1-100
    'AVAILABLE',
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
FROM generate_series(1, 9500) AS n
ON CONFLICT (event_id, tier_id, row_number, seat_number) DO NOTHING;

-- ── 5. Seats VIP: 500 seats (10 filas × 50 columnas) ─────────
INSERT INTO seat (id, event_id, tier_id, row_number, seat_number, status, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM event WHERE title = 'k6 Performance Load Test'),
    (SELECT id FROM tier
        WHERE event_id = (SELECT id FROM event WHERE title = 'k6 Performance Load Test')
        AND tier_type = 'VIP'),
    (n - 1) / 50 + 1,        -- row_number: 1-10
    (n - 1) % 50 + 1,        -- seat_number: 1-50
    'AVAILABLE',
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
FROM generate_series(1, 500) AS n
ON CONFLICT (event_id, tier_id, row_number, seat_number) DO NOTHING;
