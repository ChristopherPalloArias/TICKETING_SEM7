-- SPEC-021: Add cancellation_reason column to event table
-- This column stores the reason provided by an admin when cancelling an event.
-- It is nullable because it is only required when status = 'CANCELLED'.

ALTER TABLE event ADD COLUMN cancellation_reason VARCHAR(500) NULL;
