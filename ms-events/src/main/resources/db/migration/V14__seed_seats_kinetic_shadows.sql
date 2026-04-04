-- V14__seed_seats_kinetic_shadows.sql
-- Seed seats for Kinetic Shadows event (enableSeats=true)
-- GENERAL tier: 60 seats (6 rows x 10 seats per row)
-- VIP tier: 20 seats (4 rows x 5 seats per row)

-- GENERAL tier seats for Kinetic Shadows
INSERT INTO seat (id, event_id, tier_id, row_number, seat_number, status, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    e.id,
    t.id,
    (n - 1) / 10 + 1,
    ((n - 1) % 10) + 1,
    'AVAILABLE',
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
FROM (SELECT id FROM event WHERE title = 'Kinetic Shadows') e
CROSS JOIN (SELECT id FROM tier WHERE event_id = (SELECT id FROM event WHERE title = 'Kinetic Shadows') AND tier_type = 'GENERAL') t
CROSS JOIN (SELECT generate_series(1, 60) AS n) series
ON CONFLICT (event_id, tier_id, row_number, seat_number) DO NOTHING;

-- VIP tier seats for Kinetic Shadows
INSERT INTO seat (id, event_id, tier_id, row_number, seat_number, status, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    e.id,
    t.id,
    (n - 1) / 5 + 1,
    ((n - 1) % 5) + 1,
    'AVAILABLE',
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
FROM (SELECT id FROM event WHERE title = 'Kinetic Shadows') e
CROSS JOIN (SELECT id FROM tier WHERE event_id = (SELECT id FROM event WHERE title = 'Kinetic Shadows') AND tier_type = 'VIP') t
CROSS JOIN (SELECT generate_series(1, 20) AS n) series
ON CONFLICT (event_id, tier_id, row_number, seat_number) DO NOTHING;
