package com.tickets.events.controller;

import com.tickets.events.dto.RoomCreateRequest;
import com.tickets.events.dto.RoomResponse;
import com.tickets.events.exception.ForbiddenAccessException;
import com.tickets.events.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@Tag(name = "Rooms", description = "API para gestionar salas de eventos")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @Operation(
        summary = "Crear nueva sala",
        description = "Crear una nueva sala que puede albergar eventos. Define la capacidad máxima de la sala."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Sala creada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos (nombre vacío, maxCapacity <= 0)"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<RoomResponse> createRoom(
            @RequestHeader(value = "X-Role", required = false) String role,
            @Valid @RequestBody RoomCreateRequest request) {
        if (!"ADMIN".equals(role)) {
            throw new ForbiddenAccessException("Only users with X-Role: ADMIN can create rooms");
        }
        RoomResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(
        summary = "Listar todas las salas",
        description = "Devuelve todas las salas registradas. Usado por el selector de sala del formulario de administración."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de salas obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN")
    })
    public ResponseEntity<List<RoomResponse>> getAllRooms(
            @RequestHeader(value = "X-Role", required = false) String role) {
        if (!"ADMIN".equals(role)) {
            throw new ForbiddenAccessException("Only users with X-Role: ADMIN can list rooms");
        }
        List<RoomResponse> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/public")
    @Operation(
        summary = "Listar salas (público)",
        description = "Devuelve todas las salas registradas sin requerir autenticación. Usado por la vista pública de venues."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de salas obtenida exitosamente")
    })
    public ResponseEntity<List<RoomResponse>> getAllRoomsPublic() {
        List<RoomResponse> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{roomId}")
    @Operation(
        summary = "Obtener sala por ID",
        description = "Obtiene los detalles de una sala específica por su ID."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Sala obtenida exitosamente"),
        @ApiResponse(responseCode = "404", description = "Sala no encontrada"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable UUID roomId) {
        RoomResponse response = roomService.getRoomById(roomId);
        return ResponseEntity.ok(response);
    }
}
