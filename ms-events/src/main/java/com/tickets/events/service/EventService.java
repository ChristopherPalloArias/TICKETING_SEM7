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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        event.setImageUrl(request.imageUrl());
        event.setSubtitle(request.subtitle());
        event.setLocation(request.location());
        event.setDirector(request.director());
        event.setCastMembers(request.castMembers());
        event.setDuration(request.duration());
        event.setTag(request.tag());
        event.setIsLimited(request.isLimited() != null ? request.isLimited() : false);
        event.setIsFeatured(request.isFeatured() != null ? request.isFeatured() : false);
        event.setAuthor(request.author());

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
        if (date != null && date.isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
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
            event.getCreatedBy(),
            event.getImageUrl(),
            event.getSubtitle(),
            event.getLocation(),
            event.getDirector(),
            event.getCastMembers(),
            event.getDuration(),
            event.getTag(),
            event.getIsLimited(),
            event.getIsFeatured(),
            event.getAuthor()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPublishedEvents(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Event> publishedPage = eventRepository.findByStatus(EventStatus.PUBLISHED, pageable);

        List<EventDetailResponse> events = publishedPage.getContent().stream()
            .map(this::convertToEventDetailResponse)
            .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("total", publishedPage.getTotalElements());
        response.put("events", events);
        response.put("page", page);
        response.put("pageSize", pageSize);
        response.put("hasMore", page < publishedPage.getTotalPages());
        return response;
    }

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

    private EventDetailResponse convertToEventDetailResponse(Event event) {
        Room room = event.getRoom();
        if (room == null) {
            room = retrieveRoom(event.getRoomId());
        }
        RoomResponse roomResponse = convertRoomToResponse(room);
        
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
            event.getCreatedAt(),
            event.getImageUrl(),
            event.getSubtitle(),
            event.getLocation(),
            event.getDirector(),
            event.getCastMembers(),
            event.getDuration(),
            event.getTag(),
            event.getIsLimited(),
            event.getIsFeatured(),
            event.getAuthor()
        );
    }

    private RoomResponse convertRoomToResponse(Room room) {
        return new RoomResponse(
            room.getId(),
            room.getName(),
            room.getMaxCapacity(),
            room.getCreatedAt(),
            room.getUpdatedAt()
        );
    }

    @Transactional
    public EventResponse publishEvent(UUID eventId, String role) {
        validateAdminRole(role);

        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new EventNotFoundException("Event with id '" + eventId + "' does not exist"));

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException(
                "Event with id '" + eventId + "' cannot be published: current status is " + event.getStatus(),
                event.getStatus().name()
            );
        }

        if (!tierRepository.existsByEventId(eventId)) {
            throw new EventHasNoTiersException("Event with id '" + eventId + "' cannot be published: no tiers configured");
        }

        event.setStatus(EventStatus.PUBLISHED);
        event.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        Event saved = eventRepository.save(event);

        return convertToResponse(saved);
    }
}
