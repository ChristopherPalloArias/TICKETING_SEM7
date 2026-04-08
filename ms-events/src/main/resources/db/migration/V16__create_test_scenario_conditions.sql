-- ============================================================
-- V16__create_test_scenario_conditions.sql
-- Purpose: Set up permanent test conditions for HU-03 BDD scenarios
--
-- Scenario A – Tier Agotado:
--   "BODAS DE SANGRE" VIP tier quota = 0
--   → isAvailable=false, frontend renders aria-disabled="true" + "AGOTADO"
--
-- Scenario B – Early Bird Vencido:
--   "The Phantom's Echo" EARLY_BIRD valid_until set to a past fixed date
--   → now.isAfter(validUntil)=true → isAvailable=false → aria-disabled="true"
--
-- Depends on: V7__seed_demo_data.sql
-- ============================================================

-- A: Mark VIP tier of "BODAS DE SANGRE" as sold-out (quota = 0)
UPDATE tier
SET    quota      = 0,
       updated_at = NOW()
WHERE  tier_type  = 'VIP'
  AND  event_id   = (SELECT id FROM event WHERE title = 'BODAS DE SANGRE');

-- B: Expire the EARLY_BIRD tier of "The Phantom's Echo"
--    valid_from and valid_until are both in the past so the period has closed.
--    The constraint requires valid_from < valid_until.
UPDATE tier
SET    valid_from  = '2025-01-01 00:00:00',
       valid_until = '2025-01-15 23:59:59',
       updated_at  = NOW()
WHERE  tier_type   = 'EARLY_BIRD'
  AND  event_id    = (SELECT id FROM event WHERE title = 'The Phantom''s Echo');
