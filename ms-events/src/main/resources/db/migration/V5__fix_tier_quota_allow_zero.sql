-- Fix: Allow quota to reach 0 when all tickets are sold
-- Previous constraint CHECK (quota > 0) prevented tier from being fully depleted
ALTER TABLE tier DROP CONSTRAINT tier_quota_check;
ALTER TABLE tier ADD CONSTRAINT tier_quota_check CHECK (quota >= 0);
