-- Seed data for seat table - 4 seats per tier across 2 tiers (VIP, General)
-- Assumes 4 events exist with IDs matching common UUIDs in seeding

-- Sample event IDs from application seeding (these are created in V2__seed_events.sql)
-- We'll use INSERT with placeolder events first to ensure consistency

-- Get event and tier IDs dynamically (this assumes events and tiers were seeded)
-- For this MVP, we'll insert seats for the first 2 events with 2 tiers each

INSERT INTO seat (id, event_id, tier_id, row_number, seat_number, status, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    e.id,
    t.id,
    (ROW_NUMBER() OVER (PARTITION BY e.id, t.id ORDER BY e.id)) as row_number,
    (ROW_NUMBER() OVER (PARTITION BY e.id ORDER BY e.id) % 10) + 1 as seat_number,
    'AVAILABLE',
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
FROM (
    -- Get first 2 events
    SELECT id FROM event ORDER BY created_at ASC LIMIT 2
) e
CROSS JOIN (
    -- Get first 2 tiers for each event
    SELECT id FROM tier ORDER BY created_at ASC, id ASC LIMIT 2
) t
WHERE NOT EXISTS (
    -- Avoid duplicates if re-run
    SELECT 1 FROM seat WHERE event_id = e.id AND tier_id = t.id
);

-- Insert additional seats to create realistic inventory
-- Pattern: 20 seats total per tier (5 rows × 4 seats per row)
INSERT INTO seat (id, event_id, tier_id, row_number, seat_number, status, version, created_at, updated_at)
SELECT
    gen_random_uuid(),
    e.id,
    t.id,
    (n - 1) / 4 + 1 as row_number,
    ((n - 1) % 4) + 1 as seat_number,
    'AVAILABLE',
    0,
    NOW() AT TIME ZONE 'UTC',
    NOW() AT TIME ZONE 'UTC'
FROM (
    SELECT id FROM event ORDER BY created_at ASC LIMIT 2
) e
CROSS JOIN (
    SELECT id FROM tier ORDER BY created_at ASC, id ASC LIMIT 2
) t
CROSS JOIN (
    -- Generate 20 rows of numbers (1-20)
    SELECT generate_series(1, 20) as n
) series
WHERE NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM seat 
    WHERE event_id = e.id 
    AND tier_id = t.id
    AND row_number = ((series.n - 1) / 4 + 1)
    AND seat_number = (((series.n - 1) % 4) + 1)
);

-- Log completion
-- Comment: Created seat inventory for all events and tiers
