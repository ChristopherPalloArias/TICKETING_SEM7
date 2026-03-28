-- ============================================================
-- V7__seed_demo_data.sql
-- Seed data: 4 rooms, 4 events (PUBLISHED), 9 tiers
-- Depends on: V6__add_event_metadata_fields.sql (SPEC-011)
-- ============================================================

-- -------------------------------------------------------
-- 1. ROOMS
-- -------------------------------------------------------
INSERT INTO room (id, name, max_capacity, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Teatro Real',        300, NOW(), NOW()),
  (gen_random_uuid(), 'Grand Opera House',  500, NOW(), NOW()),
  (gen_random_uuid(), 'The Velvet Lounge',  100, NOW(), NOW()),
  (gen_random_uuid(), 'Arts Center',        150, NOW(), NOW());

-- -------------------------------------------------------
-- 2. EVENTS (reference rooms by name)
-- -------------------------------------------------------

-- Evento 1: BODAS DE SANGRE
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  tag, is_limited, is_featured, author,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'Teatro Real'),
  'BODAS DE SANGRE',
  'Una tragedia en verso y prosa donde el deseo choca contra las leyes no escritas del honor y la tierra. En esta nueva visión de Teatro Noir, la obra de Lorca se transforma en un thriller visual de sombras prolongadas y pasiones eléctricas.',
  NOW() + INTERVAL '30 days',
  200,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/theater/1200/800',
  'Federico García Lorca',
  'TEATRO REAL, MADRID',
  'Alejandro G. Iñárritu',
  'Penélope Cruz, Javier Bardem',
  120,
  'FEATURED PERFORMANCE',
  false,
  true,
  'Federico García Lorca',
  NOW(), NOW()
);

-- Evento 2: The Phantom's Echo
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  tag, is_limited, is_featured,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'Grand Opera House'),
  'The Phantom''s Echo',
  'A dramatic wide shot of a stage performance with a lone cellist in a spotlight and deep shadows in a grand theater.',
  NOW() + INTERVAL '45 days',
  400,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/opera/1200/800',
  'A Noir Opera Experience',
  'GRAND OPERA HOUSE',
  'Christopher Nolan',
  'Cillian Murphy',
  150,
  'FEATURED PERFORMANCE',
  false,
  true,
  NOW(), NOW()
);

-- Evento 3: Midnight Jazz Ritual
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  is_limited, is_featured,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'The Velvet Lounge'),
  'Midnight Jazz Ritual',
  'Dark moody atmosphere of a jazz club with golden lighting highlighting brass instruments and soft smoke swirls.',
  NOW() + INTERVAL '60 days',
  80,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/jazz/1200/800',
  'An Intimate Jazz Session',
  'THE VELVET LOUNGE',
  'Damien Chazelle',
  'Ryan Gosling',
  90,
  false,
  false,
  NOW(), NOW()
);

-- Evento 4: Kinetic Shadows
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  tag, is_limited, is_featured,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'Arts Center'),
  'Kinetic Shadows',
  'Minimalist modern dance composition with high contrast lighting on a dark stage showing two silhouettes in motion.',
  NOW() + INTERVAL '20 days',
  120,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/dance/1200/800',
  'Contemporary Dance Exhibition',
  'ARTS CENTER',
  'Sidi Larbi Cherkaoui',
  'Modern Dance Ensemble',
  75,
  'LIMITED SEATING',
  true,
  false,
  NOW(), NOW()
);

-- -------------------------------------------------------
-- 3. TIERS
-- -------------------------------------------------------

-- Tiers for BODAS DE SANGRE
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'BODAS DE SANGRE'), 'GENERAL',    75.00, 150, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'BODAS DE SANGRE'), 'VIP',        120.00,  50, NULL, NULL, 0, NOW(), NOW());

-- Tiers for The Phantom's Echo
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'The Phantom''s Echo'), 'GENERAL',    120.00, 300, NULL,  NULL,                        0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'The Phantom''s Echo'), 'VIP',         200.00,  80, NULL,  NULL,                        0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'The Phantom''s Echo'), 'EARLY_BIRD',   95.00,  20, NOW(), NOW() + INTERVAL '15 days', 0, NOW(), NOW());

-- Tiers for Midnight Jazz Ritual
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Midnight Jazz Ritual'), 'GENERAL', 45.00, 60, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Midnight Jazz Ritual'), 'VIP',     85.00, 20, NULL, NULL, 0, NOW(), NOW());

-- Tiers for Kinetic Shadows
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Kinetic Shadows'), 'GENERAL', 35.00, 100, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Kinetic Shadows'), 'VIP',     65.00,  20, NULL, NULL, 0, NOW(), NOW());
