package com.tickets.events.controller;

import com.tickets.events.dto.AdminEventDetailResponse;
import com.tickets.events.dto.RoomResponse;
import com.tickets.events.model.EventStatus;
import com.tickets.events.service.EventService;
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

@WebMvcTest(EventController.class)
class EventControllerAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    private AdminEventDetailResponse buildAdminEvent(EventStatus status) {
        RoomResponse room = new RoomResponse(UUID.randomUUID(), "Teatro Real", 300, LocalDateTime.now(), LocalDateTime.now());
        return new AdminEventDetailResponse(
            UUID.randomUUID(),
            "Test Event",
            "Description",
            LocalDateTime.now().plusDays(10),
            100,
            status,
            room,
            List.of(),
            null, null, null, null, null, null, null, false, false, null,
            "admin-user",
            LocalDateTime.now(),
            LocalDateTime.now()
        );
    }

    @Test
    void test_getAllEventsAdmin_returns_all_statuses() throws Exception {
        when(eventService.getAllEvents()).thenReturn(List.of(
            buildAdminEvent(EventStatus.DRAFT),
            buildAdminEvent(EventStatus.PUBLISHED),
            buildAdminEvent(EventStatus.CANCELLED)
        ));

        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(3))
            .andExpect(jsonPath("$.events").isArray());
    }

    @Test
    void test_getAllEventsAdmin_returns_403_without_admin_role() throws Exception {
        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "USER"))
            .andExpect(status().isForbidden());
    }

    @Test
    void test_getAllEventsAdmin_returns_403_without_role_header() throws Exception {
        mockMvc.perform(get("/api/v1/events/admin"))
            .andExpect(status().isForbidden());
    }

    @Test
    void test_getAllEventsAdmin_includes_status_field() throws Exception {
        when(eventService.getAllEvents()).thenReturn(List.of(buildAdminEvent(EventStatus.DRAFT)));

        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.events[0].status").value("DRAFT"));
    }

    @Test
    void test_getAllEventsAdmin_includes_room_and_tiers() throws Exception {
        when(eventService.getAllEvents()).thenReturn(List.of(buildAdminEvent(EventStatus.PUBLISHED)));

        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.events[0].room").isNotEmpty())
            .andExpect(jsonPath("$.events[0].availableTiers").isArray());
    }
}
