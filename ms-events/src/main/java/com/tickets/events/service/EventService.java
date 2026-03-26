package com.tickets.events.service;

import com.tickets.events.dto.AvailableTierResponse;
import com.tickets.events.dto.EventCreateRequest;
import com.tickets.events.dto.EventDetailResponse;
import com.tickets.events.dto.EventResponse;
import com.tickets.events.dto.RoomResponse;
import com.tickets.events.exception.*;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Room;
import com.tickets.events.model.Tier;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.RoomRepository;
import com.tickets.events.repository.TierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {
    
    private final EventRepository eventRepository;
    private final RoomRepository roomRepository;
    private final TierRepository tierRepository;
    private final TierService tierService;
    
    public EventResponse createEvent(EventCreateRequest request, String role, String userId) {
        validateAdminRole(role);
        
        Room room = retrieveRoom(request.roomId());
        
        validateCapacity(request.capacity(), room.getMaxCapacity());
        
        validateFutureDate(request.date());
        
        checkEventUniqueness(request.title(), request.date());

        Event event = new Event();
        event.setRoomId(request.roomId());
        event.setRoom(room);
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setDate(request.date());
        event.setCapacity(request.capacity());
        event.setStatus(EventStatus.DRAFT);
        event.setCreatedBy(userId);
        
        Event savedEvent = eventRepository.save(event);
        
        return convertToResponse(savedEvent);
    }
    
    private void validateAdminRole(String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            throw new ForbiddenAccessException("Only users with X-Role: ADMIN can create events");
        }
    }
    
    private Room retrieveRoom(java.util.UUID roomId) {
        if (roomId == null) {
            throw new InvalidEventDateException("Room ID cannot be null");
        }
        Optional<Room> room = roomRepository.findById(roomId);
        if (room.isEmpty()) {
            throw new RoomNotFoundException("Room with id '" + roomId + "' does not exist");
        }
        return room.get();
    }
    
    private void validateCapacity(Integer capacity, Integer maxCapacity) {
        if (capacity > maxCapacity) {
            throw new CapacityExceededException(
                "Capacity exceeds maximum allowed for this room",
                maxCapacity
            );
        }
    }
    
    private void validateFutureDate(LocalDateTime date) {
        if (date != null && date.isBefore(LocalDateTime.now())) {
            throw new InvalidEventDateException("Event date must be in the future");
        }
    }
    
    private void checkEventUniqueness(String title, LocalDateTime date) {
        Optional<Event> existing = eventRepository.findByTitleAndDate(title, date);
        if (existing.isPresent()) {
            throw new EventAlreadyExistsException(
                "Event with title '" + title + "' on " + date + " already exists"
            );
        }
    }
    
    private EventResponse convertToResponse(Event event) {
        return new EventResponse(
            event.getId(),
            event.getRoomId(),
            event.getTitle(),
            event.getDescription(),
            event.getDate(),
            event.getCapacity(),
            event.getStatus(),
            event.getCreatedAt(),
            event.getUpdatedAt(),
            event.getCreatedBy()
        );
    }

    /**
     * Retrieves all published events with their available tiers
     *
     * @return EventDetailResponse list wrapped in a response container
     */
    @Transactional(readOnly = true)
    public List<EventDetailResponse> getPublishedEvents() {
        List<Event> publishedEvents = eventRepository.findByStatus(EventStatus.PUBLISHED);
        
        return publishedEvents.stream()
            .map(this::convertToEventDetailResponse)
            .toList();
    }

    /**
     * Retrieves a specific published event with its available tiers
     *
     * @param eventId The UUID of the event to retrieve
     * @return EventDetailResponse with event details and available tiers
     * @throws EventNotFoundException if event not found or not published
     */
    @Transactional(readOnly = true)
    public EventDetailResponse getEventDetail(UUID eventId) {
        if (eventId == null) {
            throw new InvalidEventDateException("Event ID cannot be null");
        }
        
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new EventNotFoundException("Event with id '" + eventId + "' does not exist"));
        
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new EventNotFoundException("Event with id '" + eventId + "' is not published");
        }
        
        return convertToEventDetailResponse(event);
    }

    /**
     * Converts an Event entity to EventDetailResponse with available tiers
     *
     * @param event The event to convert
     * @return EventDetailResponse
     */
    private EventDetailResponse convertToEventDetailResponse(Event event) {
        // Convert room
        Room room = event.getRoom();
        if (room == null) {
            room = retrieveRoom(event.getRoomId());
        }
        RoomResponse roomResponse = convertRoomToResponse(room);
        
        // Get and filter tiers by availability
        List<Tier> tiers = tierRepository.findByEventId(event.getId());
        List<AvailableTierResponse> availableTiers = tiers.stream()
            .map(tierService::toAvailableTierResponse)
            .toList();
        
        return new EventDetailResponse(
            event.getId(),
            event.getTitle(),
            event.getDescription(),
            event.getDate(),
            event.getCapacity(),
            roomResponse,
            availableTiers,
            event.getCreatedAt()
        );
    }

    /**
     * Converts Room entity to RoomResponse
     *
     * @param room The room to convert
     * @return RoomResponse
     */
    private RoomResponse convertRoomToResponse(Room room) {
        return new RoomResponse(
            room.getId(),
            room.getName(),
            room.getMaxCapacity(),
            room.getCreatedAt(),
            room.getUpdatedAt()
        );
    }
}
