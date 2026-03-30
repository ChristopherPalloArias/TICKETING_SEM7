package com.tickets.events.controller;

import com.tickets.events.dto.RoomResponse;
import com.tickets.events.service.RoomService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RoomController.class)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    private RoomResponse buildRoomResponse(String name, int maxCapacity) {
        return new RoomResponse(UUID.randomUUID(), name, maxCapacity, LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void test_getAllRooms_returns_all_rooms() throws Exception {
        when(roomService.getAllRooms()).thenReturn(List.of(
            buildRoomResponse("Teatro Real", 300),
            buildRoomResponse("Grand Opera House", 500)
        ));

        mockMvc.perform(get("/api/v1/rooms")
                .header("X-Role", "ADMIN"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].name").value("Teatro Real"))
            .andExpect(jsonPath("$[1].name").value("Grand Opera House"));
    }

    @Test
    void test_getAllRooms_returns_403_without_admin_role() throws Exception {
        mockMvc.perform(get("/api/v1/rooms")
                .header("X-Role", "USER"))
            .andExpect(status().isForbidden());
    }

    @Test
    void test_getAllRooms_returns_403_without_role_header() throws Exception {
        mockMvc.perform(get("/api/v1/rooms"))
            .andExpect(status().isForbidden());
    }

    @Test
    void test_getAllRooms_returns_empty_when_no_rooms() throws Exception {
        when(roomService.getAllRooms()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/rooms")
                .header("X-Role", "ADMIN"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(0));
    }

    // --- HU-AUD-01: Endpoint público de rooms ---

    @Test
    void test_rooms_public_endpoint_returns_200_without_auth() throws Exception {
        // GIVEN — servicio retorna lista vacía (lo relevante es el status 200)
        when(roomService.getAllRooms()).thenReturn(List.of());

        // WHEN + THEN — GET /api/v1/rooms/public sin headers devuelve 200
        mockMvc.perform(get("/api/v1/rooms/public"))
            .andExpect(status().isOk());
    }

    @Test
    void test_rooms_public_endpoint_returns_room_list() throws Exception {
        // GIVEN — dos rooms con id, name y maxCapacity
        UUID roomId1 = UUID.randomUUID();
        UUID roomId2 = UUID.randomUUID();
        when(roomService.getAllRooms()).thenReturn(List.of(
            new RoomResponse(roomId1, "Teatro Real", 300, LocalDateTime.now(), LocalDateTime.now()),
            new RoomResponse(roomId2, "Grand Opera House", 500, LocalDateTime.now(), LocalDateTime.now())
        ));

        // WHEN + THEN — respuesta contiene array de rooms con id, name, maxCapacity
        mockMvc.perform(get("/api/v1/rooms/public"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].id").value(roomId1.toString()))
            .andExpect(jsonPath("$[0].name").value("Teatro Real"))
            .andExpect(jsonPath("$[0].maxCapacity").value(300))
            .andExpect(jsonPath("$[1].id").value(roomId2.toString()))
            .andExpect(jsonPath("$[1].name").value("Grand Opera House"))
            .andExpect(jsonPath("$[1].maxCapacity").value(500));
    }
}
