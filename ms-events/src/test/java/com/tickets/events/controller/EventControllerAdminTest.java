package com.tickets.events.controller;

import com.tickets.events.dto.AdminEventDetailResponse;
import com.tickets.events.dto.AdminStatsResponse;
import com.tickets.events.dto.RoomResponse;
import com.tickets.events.model.EventStatus;
import com.tickets.events.service.EventService;
import com.tickets.events.service.EventStatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EventController.class)
class EventControllerAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    @MockBean
    private EventStatsService eventStatsService;

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

    private Map<String, Object> buildPagedResponse(List<AdminEventDetailResponse> events) {
        return Map.of(
            "content", events,
            "page", 0,
            "size", 10,
            "totalElements", (long) events.size(),
            "totalPages", 1
        );
    }

    // ── GET /api/v1/events/admin — paginado ───────────────────────────────────

    @Test
    void getAllEventsAdmin_returns200_withPaginatedContent() throws Exception {
        // GIVEN
        List<AdminEventDetailResponse> events = List.of(
            buildAdminEvent(EventStatus.DRAFT),
            buildAdminEvent(EventStatus.PUBLISHED)
        );
        when(eventService.getAllEventsAdminPaged(isNull(), anyInt(), anyInt()))
            .thenReturn(buildPagedResponse(events));

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void getAllEventsAdmin_returns200_withSearchParam() throws Exception {
        // GIVEN
        List<AdminEventDetailResponse> events = List.of(buildAdminEvent(EventStatus.PUBLISHED));
        when(eventService.getAllEventsAdminPaged(any(), anyInt(), anyInt()))
            .thenReturn(buildPagedResponse(events));

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000")
                .param("search", "Test")
                .param("page", "0")
                .param("size", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getAllEventsAdmin_returnsEmptyContent_whenNoEvents() throws Exception {
        // GIVEN
        when(eventService.getAllEventsAdminPaged(isNull(), anyInt(), anyInt()))
            .thenReturn(buildPagedResponse(List.of()));

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void getAllEventsAdmin_returns403_withoutAdminRole() throws Exception {
        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin")
                .header("X-Role", "BUYER"))
            .andExpect(status().isForbidden());
    }

    @Test
    void getAllEventsAdmin_returns403_withoutRoleHeader() throws Exception {
        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin"))
            .andExpect(status().isForbidden());
    }

    // ── GET /api/v1/events/admin/stats ────────────────────────────────────────

    @Test
    void getAdminStats_returns200_withAggregatedMetrics() throws Exception {
        // GIVEN
        AdminStatsResponse stats = new AdminStatsResponse(10L, 4L, 250L, 30L);
        when(eventStatsService.getAdminStats()).thenReturn(stats);

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin/stats")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalEvents").value(10))
            .andExpect(jsonPath("$.publishedEvents").value(4))
            .andExpect(jsonPath("$.totalTicketsSold").value(250))
            .andExpect(jsonPath("$.activeReservations").value(30));
    }

    @Test
    void getAdminStats_returns200_withZeroValues_whenNoData() throws Exception {
        // GIVEN — degradación graceful: ticketing down, sin eventos
        AdminStatsResponse stats = new AdminStatsResponse(0L, 0L, 0L, 0L);
        when(eventStatsService.getAdminStats()).thenReturn(stats);

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin/stats")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "550e8400-e29b-41d4-a716-446655440000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalTicketsSold").value(0))
            .andExpect(jsonPath("$.activeReservations").value(0));
    }

    @Test
    void getAdminStats_returns403_withoutAdminRole() throws Exception {
        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin/stats")
                .header("X-Role", "BUYER"))
            .andExpect(status().isForbidden());
    }

    @Test
    void getAdminStats_returns403_withoutRoleHeader() throws Exception {
        // WHEN / THEN
        mockMvc.perform(get("/api/v1/events/admin/stats"))
            .andExpect(status().isForbidden());
    }
}
