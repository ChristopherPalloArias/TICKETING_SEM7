package com.tickets.events.service;

import com.tickets.events.dto.RoomCreateRequest;
import com.tickets.events.dto.RoomResponse;
import com.tickets.events.exception.RoomNotFoundException;
import com.tickets.events.model.Room;
import com.tickets.events.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;

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
