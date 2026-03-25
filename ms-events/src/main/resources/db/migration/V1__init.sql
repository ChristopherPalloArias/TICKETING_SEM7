

CREATE TABLE room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    max_capacity INTEGER NOT NULL CHECK (max_capacity >= 1),
    created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);



CREATE TABLE event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES room(id),
    title VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    date TIMESTAMP NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 1),
    status VARCHAR(20) DEFAULT 'DRAFT' NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') NOT NULL,
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') NOT NULL,
    UNIQUE(title, date),
    CONSTRAINT event_date_future CHECK (date > CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);



CREATE INDEX idx_event_status ON event(status);
CREATE INDEX idx_event_created_at ON event(created_at);
CREATE INDEX idx_event_room_id ON event(room_id);
