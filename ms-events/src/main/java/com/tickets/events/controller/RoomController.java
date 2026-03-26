package com.tickets.events.controller;

import com.tickets.events.dto.RoomCreateRequest;
import com.tickets.events.dto.RoomResponse;
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
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomCreateRequest request) {
        RoomResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
