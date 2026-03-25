package com.tickets.events.service;

import com.tickets.events.dto.EventCreateRequest;
import com.tickets.events.dto.EventResponse;
import com.tickets.events.exception.*;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Room;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {
    
    private final EventRepository eventRepository;
    private final RoomRepository roomRepository;
    
    public EventResponse createEvent(EventCreateRequest request, String role, String userId) {
        // Validate authorization: only ADMIN can create events
        validateAdminRole(role);
        
        // Retrieve and validate room existence
        Room room = retrieveRoom(request.roomId());
        
        // Validate capacity does not exceed room's max capacity
        validateCapacity(request.capacity(), room.getMaxCapacity());
        
        // Validate date is in the future
        validateFutureDate(request.date());
        
        // Check if event with same title and date already exists
        checkEventUniqueness(request.title(), request.date());
        
        // Create and save event
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
}
