package com.tickets.events.service;

import com.tickets.events.dto.RoomResponse;
import com.tickets.events.dto.RoomUpdateRequest;
import com.tickets.events.exception.RoomHasEventsException;
import com.tickets.events.exception.RoomNotFoundException;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Room;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.RoomRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private RoomService roomService;

    private Room buildRoom(String name, int maxCapacity) {
        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setName(name);
        room.setMaxCapacity(maxCapacity);
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());
        return room;
    }

    private Event buildEvent(UUID roomId, EventStatus status) {
        Event event = new Event();
        event.setId(UUID.randomUUID());
        event.setRoomId(roomId);
        event.setTitle("Obra de prueba");
        event.setStatus(status);
        return event;
    }

    // ── getAllRooms ────────────────────────────────────────────────────────────

    @Test
    void test_getAllRooms_returns_all_rooms() {
        Room r1 = buildRoom("Teatro Real", 300);
        Room r2 = buildRoom("Grand Opera House", 500);

        when(roomRepository.findAll()).thenReturn(List.of(r1, r2));

        List<RoomResponse> result = roomService.getAllRooms();

        assertThat(result).hasSize(2);
        assertThat(result.stream().map(RoomResponse::name))
            .containsExactlyInAnyOrder("Teatro Real", "Grand Opera House");
    }

    @Test
    void test_getAllRooms_returns_empty_when_no_rooms() {
        when(roomRepository.findAll()).thenReturn(List.of());

        List<RoomResponse> result = roomService.getAllRooms();

        assertThat(result).isEmpty();
    }

    @Test
    void test_getAllRooms_response_includes_maxCapacity() {
        Room room = buildRoom("Teatro Pequeño", 100);

        when(roomRepository.findAll()).thenReturn(List.of(room));

        List<RoomResponse> result = roomService.getAllRooms();

        assertThat(result.get(0).maxCapacity()).isEqualTo(100);
    }

    // ── updateRoom ────────────────────────────────────────────────────────────

    @Test
    void updateRoom_success_returnsUpdatedResponse() {
        // GIVEN
        UUID roomId = UUID.randomUUID();
        Room existing = buildRoom("Sala Vieja", 200);
        existing.setId(roomId);

        Room updated = buildRoom("Sala Nueva", 350);
        updated.setId(roomId);

        RoomUpdateRequest request = new RoomUpdateRequest("Sala Nueva", 350);

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(existing));
        when(roomRepository.save(any(Room.class))).thenReturn(updated);

        // WHEN
        RoomResponse result = roomService.updateRoom(roomId, request);

        // THEN
        assertThat(result.name()).isEqualTo("Sala Nueva");
        assertThat(result.maxCapacity()).isEqualTo(350);
        verify(roomRepository).save(existing);
    }

    @Test
    void updateRoom_throwsRoomNotFoundException_whenRoomDoesNotExist() {
        // GIVEN
        UUID unknownId = UUID.randomUUID();
        when(roomRepository.findById(unknownId)).thenReturn(Optional.empty());

        // WHEN / THEN
        assertThrows(RoomNotFoundException.class,
            () -> roomService.updateRoom(unknownId, new RoomUpdateRequest("X", 100)));
        verify(roomRepository, never()).save(any());
    }

    @Test
    void updateRoom_updatesNameAndCapacityOnExistingEntity() {
        // GIVEN
        UUID roomId = UUID.randomUUID();
        Room existing = buildRoom("Original", 100);
        existing.setId(roomId);

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(existing));
        when(roomRepository.save(any(Room.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        roomService.updateRoom(roomId, new RoomUpdateRequest("Renamed", 250));

        // THEN — verify mutations applied to entity before save
        assertThat(existing.getName()).isEqualTo("Renamed");
        assertThat(existing.getMaxCapacity()).isEqualTo(250);
    }

    // ── deleteRoom ────────────────────────────────────────────────────────────

    @Test
    void deleteRoom_success_deletesRoom_whenNoActiveEvents() {
        // GIVEN
        UUID roomId = UUID.randomUUID();
        Room room = buildRoom("Sala Libre", 200);
        room.setId(roomId);

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(eventRepository.findByRoomId(roomId)).thenReturn(List.of());

        // WHEN
        roomService.deleteRoom(roomId);

        // THEN
        verify(roomRepository).delete(room);
    }

    @Test
    void deleteRoom_success_deletesRoom_whenOnlyCancelledEvents() {
        // GIVEN
        UUID roomId = UUID.randomUUID();
        Room room = buildRoom("Sala con Cancelados", 100);
        room.setId(roomId);
        Event cancelled = buildEvent(roomId, EventStatus.CANCELLED);

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(eventRepository.findByRoomId(roomId)).thenReturn(List.of(cancelled));

        // WHEN
        roomService.deleteRoom(roomId);

        // THEN
        verify(roomRepository).delete(room);
    }

    @Test
    void deleteRoom_throwsRoomNotFoundException_whenRoomDoesNotExist() {
        // GIVEN
        UUID unknownId = UUID.randomUUID();
        when(roomRepository.findById(unknownId)).thenReturn(Optional.empty());

        // WHEN / THEN
        assertThrows(RoomNotFoundException.class,
            () -> roomService.deleteRoom(unknownId));
        verify(roomRepository, never()).delete(any(Room.class));
    }

    @Test
    void deleteRoom_throwsRoomHasEventsException_whenHasDraftEvents() {
        // GIVEN
        UUID roomId = UUID.randomUUID();
        Room room = buildRoom("Sala con Drafts", 100);
        room.setId(roomId);
        Event draft = buildEvent(roomId, EventStatus.DRAFT);
        draft.setTitle("Obra en Borrador");

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(eventRepository.findByRoomId(roomId)).thenReturn(List.of(draft));

        // WHEN / THEN
        RoomHasEventsException ex = assertThrows(RoomHasEventsException.class,
            () -> roomService.deleteRoom(roomId));
        assertThat(ex.getEventTitles()).contains("Obra en Borrador");
        verify(roomRepository, never()).delete(any(Room.class));
    }

    @Test
    void deleteRoom_throwsRoomHasEventsException_whenHasPublishedEvents() {
        // GIVEN
        UUID roomId = UUID.randomUUID();
        Room room = buildRoom("Sala Activa", 300);
        room.setId(roomId);
        Event published = buildEvent(roomId, EventStatus.PUBLISHED);
        published.setTitle("Obra Publicada");

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(eventRepository.findByRoomId(roomId)).thenReturn(List.of(published));

        // WHEN / THEN
        RoomHasEventsException ex = assertThrows(RoomHasEventsException.class,
            () -> roomService.deleteRoom(roomId));
        assertThat(ex.getEventTitles()).contains("Obra Publicada");
        verify(roomRepository, never()).delete(any(Room.class));
    }

    @Test
    void deleteRoom_throwsRoomHasEventsException_withAllActiveEventTitles() {
        // GIVEN
        UUID roomId = UUID.randomUUID();
        Room room = buildRoom("Sala Mixta", 300);
        room.setId(roomId);
        Event draft = buildEvent(roomId, EventStatus.DRAFT);
        draft.setTitle("Borrador A");
        Event published = buildEvent(roomId, EventStatus.PUBLISHED);
        published.setTitle("Publicado B");

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(eventRepository.findByRoomId(roomId)).thenReturn(List.of(draft, published));

        // WHEN / THEN
        RoomHasEventsException ex = assertThrows(RoomHasEventsException.class,
            () -> roomService.deleteRoom(roomId));
        assertThat(ex.getEventTitles()).containsExactlyInAnyOrder("Borrador A", "Publicado B");
    }
}
