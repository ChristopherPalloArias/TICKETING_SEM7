package com.tickets.events.controller;

import com.tickets.events.dto.RoomCreateRequest;
import com.tickets.events.dto.RoomResponse;
import com.tickets.events.dto.RoomUpdateRequest;
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
    @Operation(summary = "Crear nueva sala", description = "Crea una nueva sala. Requiere rol ADMIN.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Sala creada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN")
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
    @Operation(summary = "Listar todas las salas", description = "Devuelve todas las salas. Requiere rol ADMIN.")
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
    @Operation(summary = "Listar salas (público)", description = "Devuelve todas las salas sin requerir autenticación.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de salas obtenida exitosamente")
    })
    public ResponseEntity<List<RoomResponse>> getAllRoomsPublic() {
        List<RoomResponse> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{roomId}")
    @Operation(summary = "Obtener sala por ID", description = "Obtiene los detalles de una sala específica.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Sala obtenida exitosamente"),
        @ApiResponse(responseCode = "404", description = "Sala no encontrada")
    })
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable UUID roomId) {
        RoomResponse response = roomService.getRoomById(roomId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{roomId}")
    @Operation(summary = "Actualizar sala", description = "Actualiza nombre y capacidad de una sala existente. Requiere rol ADMIN.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Sala actualizada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Sala no encontrada")
    })
    public ResponseEntity<RoomResponse> updateRoom(
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable UUID roomId,
            @Valid @RequestBody RoomUpdateRequest request) {
        if (!"ADMIN".equals(role)) {
            throw new ForbiddenAccessException("Only users with X-Role: ADMIN can update rooms");
        }
        RoomResponse response = roomService.updateRoom(roomId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{roomId}")
    @Operation(summary = "Eliminar sala", description = "Elimina una sala. Falla si tiene eventos DRAFT o PUBLISHED asociados. Requiere rol ADMIN.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Sala eliminada exitosamente"),
        @ApiResponse(responseCode = "400", description = "La sala tiene eventos asociados"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Sala no encontrada")
    })
    public ResponseEntity<Void> deleteRoom(
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable UUID roomId) {
        if (!"ADMIN".equals(role)) {
            throw new ForbiddenAccessException("Only users with X-Role: ADMIN can delete rooms");
        }
        roomService.deleteRoom(roomId);
        return ResponseEntity.noContent().build();
    }
}
