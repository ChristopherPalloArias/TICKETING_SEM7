package com.tickets.events.service;

import com.tickets.events.dto.RoomCreateRequest;
import com.tickets.events.dto.RoomResponse;
import com.tickets.events.dto.RoomUpdateRequest;
import com.tickets.events.exception.RoomHasEventsException;
import com.tickets.events.exception.RoomNotFoundException;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Room;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final EventRepository eventRepository;

    @Transactional
    public RoomResponse createRoom(RoomCreateRequest request) {
        Objects.requireNonNull(request, "RoomCreateRequest must not be null");

        Room room = new Room();
        room.setName(request.name());
        room.setMaxCapacity(request.maxCapacity());

        Room savedRoom = roomRepository.save(room);
        return mapToResponse(savedRoom);
    }

    public RoomResponse getRoomById(UUID roomId) {
        Objects.requireNonNull(roomId, "roomId must not be null");

        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new RoomNotFoundException("Room with ID " + roomId + " not found"));

        return mapToResponse(room);
    }

    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional
    public RoomResponse updateRoom(UUID roomId, RoomUpdateRequest request) {
        Objects.requireNonNull(roomId, "roomId must not be null");
        Objects.requireNonNull(request, "RoomUpdateRequest must not be null");

        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new RoomNotFoundException("Room with ID " + roomId + " not found"));

        room.setName(request.name());
        room.setMaxCapacity(request.maxCapacity());

        Room savedRoom = roomRepository.save(room);
        return mapToResponse(savedRoom);
    }

    @Transactional
    public void deleteRoom(UUID roomId) {
        Objects.requireNonNull(roomId, "roomId must not be null");

        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new RoomNotFoundException("Room with ID " + roomId + " not found"));

        List<Event> associatedEvents = eventRepository.findByRoomId(roomId);
        List<Event> activeEvents = associatedEvents.stream()
            .filter(e -> e.getStatus() == EventStatus.DRAFT || e.getStatus() == EventStatus.PUBLISHED)
            .toList();

        if (!activeEvents.isEmpty()) {
            List<String> eventTitles = activeEvents.stream().map(Event::getTitle).toList();
            throw new RoomHasEventsException(
                "No se puede eliminar la sala. Tiene eventos asociados",
                eventTitles
            );
        }

        roomRepository.delete(room);
    }

    private RoomResponse mapToResponse(Room room) {
        return new RoomResponse(
            room.getId(),
            room.getName(),
            room.getMaxCapacity(),
            room.getCreatedAt(),
            room.getUpdatedAt()
        );
    }
}
