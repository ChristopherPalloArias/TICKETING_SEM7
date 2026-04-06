package com.tickets.events.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tickets.events.dto.CancelEventResponse;
import com.tickets.events.dto.EventResponse;
import com.tickets.events.dto.EventUpdateRequest;
import com.tickets.events.exception.EventUpdateNotAllowedException;
import com.tickets.events.exception.ForbiddenAccessException;
import com.tickets.events.exception.GlobalExceptionHandler;
import com.tickets.events.exception.InvalidQuotaException;
import com.tickets.events.model.EventStatus;
import com.tickets.events.service.EventService;
import com.tickets.events.service.EventStatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
@Import(GlobalExceptionHandler.class)
class EventControllerMutationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EventService eventService;

    @MockBean
    private EventStatsService eventStatsService;

    @Test
    void test_putUpdateEvent_draft_success_returns200() throws Exception {
        UUID eventId = UUID.randomUUID();
        EventUpdateRequest request = new EventUpdateRequest(
            "Updated Title",
            "Updated Subtitle",
            "Updated Description",
            LocalDateTime.now().plusDays(20),
            200,
            UUID.randomUUID(),
            "https://image.example/new.png",
            "New Director",
            "Actor 1, Actor 2",
            "New Location"
        );

        EventResponse response = new EventResponse(
            eventId,
            request.roomId(),
            request.title(),
            request.description(),
            request.date(),
            request.capacity(),
            EventStatus.DRAFT,
            LocalDateTime.now(),
            LocalDateTime.now(),
            "admin-user",
            request.imageUrl(),
            request.subtitle(),
            request.location(),
            request.director(),
            request.castMembers(),
            null,
            null,
            false,
            false,
            null,
            null
        );

        when(eventService.updateEvent(eq(eventId), any(EventUpdateRequest.class), eq("ADMIN")))
            .thenReturn(response);

        mockMvc.perform(put("/api/v1/events/{eventId}", eventId)
                .header("X-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(eventId.toString()))
            .andExpect(jsonPath("$.title").value("Updated Title"))
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void test_putUpdateEvent_published_structural_fields_returns400() throws Exception {
        UUID eventId = UUID.randomUUID();
        EventUpdateRequest request = new EventUpdateRequest(
            "New Title",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );

        when(eventService.updateEvent(eq(eventId), any(EventUpdateRequest.class), eq("ADMIN")))
            .thenThrow(new EventUpdateNotAllowedException("Cannot modify structural fields"));

        mockMvc.perform(put("/api/v1/events/{eventId}", eventId)
                .header("X-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("EVENT_UPDATE_NOT_ALLOWED"));
    }

    @Test
    void test_putUpdateEvent_capacity_lower_than_tier_quotas_returns400() throws Exception {
        UUID eventId = UUID.randomUUID();
        EventUpdateRequest request = new EventUpdateRequest(
            null,
            null,
            null,
            null,
            50,
            null,
            null,
            null,
            null,
            null
        );

        when(eventService.updateEvent(eq(eventId), any(EventUpdateRequest.class), eq("ADMIN")))
            .thenThrow(new InvalidQuotaException("Capacity is lower than total quotas"));

        mockMvc.perform(put("/api/v1/events/{eventId}", eventId)
                .header("X-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("INVALID_QUOTA"));
    }

    @Test
    void test_patchCancelEvent_success_changes_status_to_cancelled() throws Exception {
        UUID eventId = UUID.randomUUID();
        CancelEventResponse response = new CancelEventResponse(
            eventId,
            "Evento Test",
            EventStatus.CANCELLED,
            "Motivo de cancelacion",
            LocalDateTime.now()
        );

        when(eventService.cancelEvent(eventId, "Motivo de cancelacion", "ADMIN")).thenReturn(response);

        mockMvc.perform(patch("/api/v1/events/{eventId}/cancel", eventId)
                .header("X-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cancellationReason\":\"Motivo de cancelacion\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"))
            .andExpect(jsonPath("$.cancellationReason").value("Motivo de cancelacion"));
    }

    @Test
    void test_patchCancelEvent_calls_service_to_publish_event_cancelled() throws Exception {
        UUID eventId = UUID.randomUUID();
        CancelEventResponse response = new CancelEventResponse(
            eventId,
            "Evento Test",
            EventStatus.CANCELLED,
            "Motivo",
            LocalDateTime.now()
        );

        when(eventService.cancelEvent(eventId, "Motivo", "ADMIN")).thenReturn(response);

        mockMvc.perform(patch("/api/v1/events/{eventId}/cancel", eventId)
                .header("X-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cancellationReason\":\"Motivo\"}"))
            .andExpect(status().isOk());

        verify(eventService).cancelEvent(eventId, "Motivo", "ADMIN");
    }

    @Test
    void test_patchCancelEvent_only_published_allowed_returns400() throws Exception {
        UUID eventId = UUID.randomUUID();

        when(eventService.cancelEvent(eventId, "Motivo", "ADMIN"))
            .thenThrow(new EventUpdateNotAllowedException("Solo eventos PUBLISHED pueden cancelarse"));

        mockMvc.perform(patch("/api/v1/events/{eventId}/cancel", eventId)
                .header("X-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cancellationReason\":\"Motivo\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("EVENT_UPDATE_NOT_ALLOWED"));
    }

    @Test
    void test_putUpdateEvent_with_buyer_role_returns403() throws Exception {
        UUID eventId = UUID.randomUUID();

        when(eventService.updateEvent(eq(eventId), any(EventUpdateRequest.class), eq("BUYER")))
            .thenThrow(new ForbiddenAccessException("Only users with X-Role: ADMIN can create events"));

        mockMvc.perform(put("/api/v1/events/{eventId}", eventId)
                .header("X-Role", "BUYER")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"try\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }
}
