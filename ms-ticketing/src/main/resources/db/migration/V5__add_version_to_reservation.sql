-- HU-FIX-F: Add optimistic locking version column to reservation table
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0 NOT NULL;
