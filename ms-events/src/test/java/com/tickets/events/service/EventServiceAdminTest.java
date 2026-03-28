package com.tickets.events.service;

import com.tickets.events.dto.AdminEventDetailResponse;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Room;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.RoomRepository;
import com.tickets.events.repository.TierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceAdminTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private TierRepository tierRepository;

    @Mock
    private TierService tierService;

    @InjectMocks
    private EventService eventService;

    private Room buildRoom() {
        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setName("Teatro Real");
        room.setMaxCapacity(300);
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());
        return room;
    }

    private Event buildEvent(EventStatus status, Room room) {
        Event event = new Event();
        event.setId(UUID.randomUUID());
        event.setRoomId(room.getId());
        event.setRoom(room);
        event.setTitle("Test Event");
        event.setDescription("Description");
        event.setDate(LocalDateTime.now().plusDays(10));
        event.setCapacity(100);
        event.setStatus(status);
        event.setCreatedBy("admin-user");
        event.setIsLimited(false);
        event.setIsFeatured(false);
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        return event;
    }

    @Test
    void test_getAllEvents_returns_all_statuses() {
        Room room = buildRoom();
        Event draftEvent = buildEvent(EventStatus.DRAFT, room);
        Event publishedEvent = buildEvent(EventStatus.PUBLISHED, room);
        Event cancelledEvent = buildEvent(EventStatus.CANCELLED, room);

        when(eventRepository.findAll()).thenReturn(List.of(draftEvent, publishedEvent, cancelledEvent));
        when(tierRepository.findByEventId(draftEvent.getId())).thenReturn(List.of());
        when(tierRepository.findByEventId(publishedEvent.getId())).thenReturn(List.of());
        when(tierRepository.findByEventId(cancelledEvent.getId())).thenReturn(List.of());

        List<AdminEventDetailResponse> result = eventService.getAllEvents();

        assertThat(result).hasSize(3);
        assertThat(result.stream().map(AdminEventDetailResponse::status))
            .containsExactlyInAnyOrder(EventStatus.DRAFT, EventStatus.PUBLISHED, EventStatus.CANCELLED);
    }

    @Test
    void test_getAllEvents_includes_status_field() {
        Room room = buildRoom();
        Event event = buildEvent(EventStatus.DRAFT, room);

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(tierRepository.findByEventId(event.getId())).thenReturn(List.of());

        List<AdminEventDetailResponse> result = eventService.getAllEvents();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void test_getAllEvents_includes_room_and_tiers() {
        Room room = buildRoom();
        Event event = buildEvent(EventStatus.PUBLISHED, room);

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(tierRepository.findByEventId(event.getId())).thenReturn(List.of());

        List<AdminEventDetailResponse> result = eventService.getAllEvents();

        assertThat(result).hasSize(1);
        AdminEventDetailResponse response = result.get(0);
        assertThat(response.room()).isNotNull();
        assertThat(response.room().name()).isEqualTo("Teatro Real");
        assertThat(response.availableTiers()).isNotNull();
    }

    @Test
    void test_getAllEvents_returns_empty_when_no_events() {
        when(eventRepository.findAll()).thenReturn(List.of());

        List<AdminEventDetailResponse> result = eventService.getAllEvents();

        assertThat(result).isEmpty();
    }
}
