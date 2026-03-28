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
}
