package com.tickets.events.controller;

import com.tickets.events.dto.AdminEventDetailResponse;
import com.tickets.events.dto.CancelEventRequest;
import com.tickets.events.dto.CancelEventResponse;
import com.tickets.events.dto.EventCreateRequest;
import com.tickets.events.dto.EventDetailResponse;
import com.tickets.events.dto.EventResponse;
import com.tickets.events.dto.EventUpdateRequest;
import com.tickets.events.exception.ForbiddenAccessException;
import com.tickets.events.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "API para gestionar eventos")
public class EventController {
    
    private final EventService eventService;
    
    @PostMapping
    @Operation(
        summary = "Crear nuevo evento",
        description = "Crear un evento en estado DRAFT. Solo usuarios con rol ADMIN pueden crear eventos."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Evento creado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos o capacity excede maxCapacity"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Room no encontrada"),
        @ApiResponse(responseCode = "409", description = "Evento con mismo título y fecha ya existe")
    })
    public ResponseEntity<EventResponse> createEvent(
        @Valid @RequestBody EventCreateRequest request,
        @RequestHeader("X-Role") String role,
        @RequestHeader("X-User-Id") String userId
    ) {
        EventResponse response = eventService.createEvent(request, role, userId);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    @Operation(
        summary = "Obtener eventos publicados",
        description = "Obtiene lista paginada de todos los eventos con status PUBLISHED y su disponibilidad de tiers. No requiere autenticación."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de eventos obtenida exitosamente"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<Map<String, Object>> getPublishedEvents(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int pageSize
    ) {
        Map<String, Object> response = eventService.getPublishedEvents(page, pageSize);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventId}")
    @Operation(
        summary = "Obtener detalle de evento",
        description = "Obtiene información completa de un evento publicado con su disponibilidad de tiers. No requiere autenticación."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Evento obtenido exitosamente"),
        @ApiResponse(responseCode = "404", description = "Evento no encontrado o no está publicado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<EventDetailResponse> getEventDetail(@PathVariable UUID eventId) {
        EventDetailResponse event = eventService.getEventDetail(eventId);
        return ResponseEntity.ok(event);
    }

    @PatchMapping("/{eventId}/publish")
    @Operation(
        summary = "Publicar evento",
        description = "Transiciona un evento de DRAFT a PUBLISHED. Requiere al menos un tier configurado. Solo usuarios con rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Evento publicado exitosamente"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Evento no encontrado"),
        @ApiResponse(responseCode = "409", description = "Evento no está en estado DRAFT"),
        @ApiResponse(responseCode = "422", description = "Evento no tiene tiers configurados")
    })
    public ResponseEntity<EventResponse> publishEvent(
        @PathVariable UUID eventId,
        @RequestHeader("X-Role") String role
    ) {
        EventResponse response = eventService.publishEvent(eventId, role);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin")
    @Operation(
        summary = "Listar todos los eventos (admin)",
        description = "Devuelve todos los eventos sin filtrar por estado (DRAFT, PUBLISHED, CANCELLED). Solo usuarios con rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de todos los eventos obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN")
    })
    public ResponseEntity<Map<String, Object>> getAllEventsAdmin(
        @RequestHeader(value = "X-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        if (!"ADMIN".equals(role)) {
            throw new ForbiddenAccessException("Only users with X-Role: ADMIN can access admin endpoints");
        }
        List<AdminEventDetailResponse> events = eventService.getAllEvents();
        return ResponseEntity.ok(Map.of("total", events.size(), "events", events));
    }

    @PutMapping("/{eventId}")
    @Operation(
        summary = "Editar evento",
        description = "Actualiza los campos de un evento. Para DRAFT se permiten todos los campos; para PUBLISHED solo campos no-estructurales."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Evento actualizado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Intento de modificar campo estructural en PUBLISHED o capacidad inválida"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Evento no encontrado")
    })
    public ResponseEntity<EventResponse> updateEvent(
        @PathVariable UUID eventId,
        @Valid @RequestBody EventUpdateRequest request,
        @RequestHeader("X-Role") String role
    ) {
        EventResponse response = eventService.updateEvent(eventId, request, role);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{eventId}/cancel")
    @Operation(
        summary = "Cancelar evento",
        description = "Cancela un evento PUBLISHED. Publica evento RabbitMQ event.cancelled. Solo usuarios con rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Evento cancelado exitosamente"),
        @ApiResponse(responseCode = "400", description = "El evento no está en estado PUBLISHED"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Evento no encontrado")
    })
    public ResponseEntity<CancelEventResponse> cancelEvent(
        @PathVariable UUID eventId,
        @Valid @RequestBody CancelEventRequest request,
        @RequestHeader("X-Role") String role
    ) {
        CancelEventResponse response = eventService.cancelEvent(eventId, request.cancellationReason(), role);
        return ResponseEntity.ok(response);
    }
}
