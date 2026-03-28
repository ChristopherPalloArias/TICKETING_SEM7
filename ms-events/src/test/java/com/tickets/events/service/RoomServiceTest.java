package com.tickets.events.service;

import com.tickets.events.dto.RoomResponse;
import com.tickets.events.model.Room;
import com.tickets.events.repository.RoomRepository;
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
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

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
}
