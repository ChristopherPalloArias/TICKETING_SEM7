-- Add enable_seats column to event table
ALTER TABLE event ADD COLUMN enable_seats BOOLEAN NOT NULL DEFAULT FALSE;
