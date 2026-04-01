package com.tickets.events.exception;

import java.util.List;

public class RoomHasEventsException extends RuntimeException {

    private final List<String> eventTitles;

    public RoomHasEventsException(String message, List<String> eventTitles) {
        super(message);
        this.eventTitles = eventTitles;
    }

    public List<String> getEventTitles() {
        return eventTitles;
    }
}
