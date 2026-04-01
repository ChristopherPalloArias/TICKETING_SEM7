package com.tickets.events.service;

import com.tickets.events.dto.AdminEventDetailResponse;
import com.tickets.events.dto.EventCancelledMessage;
import com.tickets.events.dto.EventResponse;
import com.tickets.events.dto.EventUpdateRequest;
import com.tickets.events.exception.EventUpdateNotAllowedException;
import com.tickets.events.exception.ForbiddenAccessException;
import com.tickets.events.exception.InvalidQuotaException;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Room;
import com.tickets.events.model.Tier;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.RoomRepository;
import com.tickets.events.repository.TierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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

    @Mock
    private EventPublisherService eventPublisherService;

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

    private Tier buildTier(UUID eventId, int quota) {
        Tier tier = new Tier();
        tier.setId(UUID.randomUUID());
        tier.setEventId(eventId);
        tier.setQuota(quota);
        return tier;
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

    @Test
    void test_updateEvent_draft_allows_structural_changes() {
        Room currentRoom = buildRoom();
        Room newRoom = buildRoom();
        Event draftEvent = buildEvent(EventStatus.DRAFT, currentRoom);

        EventUpdateRequest request = new EventUpdateRequest(
            "Updated Event",
            "Updated Subtitle",
            "Updated Description",
            LocalDateTime.now().plusDays(20),
            140,
            newRoom.getId(),
            "https://image.example/new.jpg",
            "New Director",
            "Actor 1, Actor 2",
            "New Location"
        );

        when(eventRepository.findById(draftEvent.getId())).thenReturn(Optional.of(draftEvent));
        when(roomRepository.findById(newRoom.getId())).thenReturn(Optional.of(newRoom));
        when(tierRepository.findByEventId(draftEvent.getId())).thenReturn(List.of(
            buildTier(draftEvent.getId(), 50),
            buildTier(draftEvent.getId(), 30)
        ));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = eventService.updateEvent(draftEvent.getId(), request, "ADMIN");

        assertThat(response.title()).isEqualTo("Updated Event");
        assertThat(response.capacity()).isEqualTo(140);
        assertThat(response.roomId()).isEqualTo(newRoom.getId());
        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void test_updateEvent_published_rejects_structural_fields() {
        Room room = buildRoom();
        Event publishedEvent = buildEvent(EventStatus.PUBLISHED, room);

        EventUpdateRequest request = new EventUpdateRequest(
            "Cannot change title",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );

        when(eventRepository.findById(publishedEvent.getId())).thenReturn(Optional.of(publishedEvent));

        assertThrows(
            EventUpdateNotAllowedException.class,
            () -> eventService.updateEvent(publishedEvent.getId(), request, "ADMIN")
        );
    }

    @Test
    void test_updateEvent_rejects_capacity_lower_than_total_tier_quota() {
        Room room = buildRoom();
        Event draftEvent = buildEvent(EventStatus.DRAFT, room);

        EventUpdateRequest request = new EventUpdateRequest(
            null,
            null,
            null,
            null,
            60,
            null,
            null,
            null,
            null,
            null
        );

        when(eventRepository.findById(draftEvent.getId())).thenReturn(Optional.of(draftEvent));
        when(tierRepository.findByEventId(draftEvent.getId())).thenReturn(List.of(
            buildTier(draftEvent.getId(), 50),
            buildTier(draftEvent.getId(), 40)
        ));

        assertThrows(
            InvalidQuotaException.class,
            () -> eventService.updateEvent(draftEvent.getId(), request, "ADMIN")
        );
    }

    @Test
    void test_cancelEvent_published_changes_status_to_cancelled() {
        Room room = buildRoom();
        Event publishedEvent = buildEvent(EventStatus.PUBLISHED, room);

        when(eventRepository.findById(publishedEvent.getId())).thenReturn(Optional.of(publishedEvent));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = eventService.cancelEvent(publishedEvent.getId(), "Evento cancelado", "ADMIN");

        assertThat(response.status()).isEqualTo(EventStatus.CANCELLED);
        assertThat(response.cancellationReason()).isEqualTo("Evento cancelado");
        verify(eventRepository).save(publishedEvent);
    }

    @Test
    void test_cancelEvent_published_publishes_event_cancelled_message() {
        Room room = buildRoom();
        Event publishedEvent = buildEvent(EventStatus.PUBLISHED, room);

        when(eventRepository.findById(publishedEvent.getId())).thenReturn(Optional.of(publishedEvent));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        eventService.cancelEvent(publishedEvent.getId(), "Motivo de prueba", "ADMIN");

        ArgumentCaptor<EventCancelledMessage> captor = ArgumentCaptor.forClass(EventCancelledMessage.class);
        verify(eventPublisherService).publishEventCancelled(captor.capture());

        EventCancelledMessage publishedMessage = captor.getValue();
        assertThat(publishedMessage.eventId()).isEqualTo(publishedEvent.getId());
        assertThat(publishedMessage.cancellationReason()).isEqualTo("Motivo de prueba");
    }

    @Test
    void test_cancelEvent_only_published_events_are_allowed() {
        Room room = buildRoom();
        Event draftEvent = buildEvent(EventStatus.DRAFT, room);

        when(eventRepository.findById(draftEvent.getId())).thenReturn(Optional.of(draftEvent));

        assertThrows(
            EventUpdateNotAllowedException.class,
            () -> eventService.cancelEvent(draftEvent.getId(), "Motivo", "ADMIN")
        );
        verify(eventRepository, never()).save(any(Event.class));
        verifyNoInteractions(eventPublisherService);
    }

    @Test
    void test_updateEvent_with_buyer_role_is_forbidden() {
        EventUpdateRequest request = new EventUpdateRequest(null, null, null, null, null, null, null, null, null, null);

        assertThrows(
            ForbiddenAccessException.class,
            () -> eventService.updateEvent(UUID.randomUUID(), request, "BUYER")
        );
        verifyNoInteractions(eventRepository);
    }
}
