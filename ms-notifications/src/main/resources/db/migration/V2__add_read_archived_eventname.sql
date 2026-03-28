ALTER TABLE notification ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification ADD COLUMN event_name VARCHAR(255);

CREATE INDEX idx_notification_buyer_archived_read
    ON notification (buyer_id, is_archived, is_read);
