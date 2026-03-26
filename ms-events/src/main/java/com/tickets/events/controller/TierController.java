package com.tickets.events.controller;

import com.tickets.events.dto.DecrementQuotaRequest;
import com.tickets.events.dto.IncrementQuotaRequest;
import com.tickets.events.dto.TierConfigurationResponse;
import com.tickets.events.dto.TierCreateRequest;
import com.tickets.events.dto.TierResponse;
import com.tickets.events.exception.UnauthorizedServiceException;
import com.tickets.events.service.TierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Tiers", description = "API para gestionar tiers (categorías de precios) de eventos")
public class TierController {

    private final TierService tierService;

    @Value("${service.auth.secret}")
    private String serviceAuthSecret;

    @PostMapping("/{eventId}/tiers")
    @Operation(
        summary = "Configurar tiers de un evento",
        description = "Configura los tiers (categorías de precios) para un evento en estado DRAFT. Solo usuarios con rol ADMIN pueden configurar tiers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Tiers configurados exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos o total quota excede capacity"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Evento no encontrado"),
        @ApiResponse(responseCode = "409", description = "El evento ya tiene tiers configurados")
    })
    public ResponseEntity<TierConfigurationResponse> configureEventTiers(
        @PathVariable UUID eventId,
        @Valid @RequestBody List<@Valid TierCreateRequest> tierRequests,
        @RequestHeader("X-Role") String role,
        @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        TierConfigurationResponse response = tierService.configureEventTiers(eventId, tierRequests, role, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{eventId}/tiers")
    @Operation(
        summary = "Obtener tiers de un evento",
        description = "Obtiene lista de todos los tiers configurados para un evento. No requiere autenticación."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tiers obtenidos exitosamente"),
        @ApiResponse(responseCode = "404", description = "Evento no encontrado"),
        @ApiResponse(responseCode = "500", description = "Error interno del servidor")
    })
    public ResponseEntity<TierConfigurationResponse> getEventTiers(@PathVariable UUID eventId) {
        TierConfigurationResponse response = tierService.getEventTiers(eventId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{eventId}/tiers")
    @Operation(
        summary = "Eliminar tiers de un evento",
        description = "Elimina todos los tiers configurados de un evento en estado DRAFT. Solo usuarios con rol ADMIN pueden eliminar tiers."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Tiers eliminados exitosamente"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado - se requiere rol ADMIN"),
        @ApiResponse(responseCode = "404", description = "Evento no encontrado"),
        @ApiResponse(responseCode = "409", description = "No se puede eliminar tiers de un evento publicado")
    })
    public ResponseEntity<Void> deleteEventTiers(
        @PathVariable UUID eventId,
        @RequestHeader("X-Role") String role,
        @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        tierService.deleteEventTiers(eventId, role, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{eventId}/tiers/{tierId}/quota")
    @Operation(
        summary = "Decrementar quota de un tier",
        description = "Decrementa atómicamente la quota disponible de un tier. Uso interno de ms-ticketing al crear reservation. Requiere X-Service-Auth e X-Idempotency-Key para idempotencia."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Quota decrementada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "401", description = "X-Service-Auth ausente o incorrecto"),
        @ApiResponse(responseCode = "404", description = "Tier o evento no encontrado"),
        @ApiResponse(responseCode = "409", description = "Quota insuficiente o conflicto de concurrencia")
    })
    public ResponseEntity<TierResponse> decrementTierQuota(
        @PathVariable UUID eventId,
        @PathVariable UUID tierId,
        @Valid @RequestBody DecrementQuotaRequest request,
        @RequestHeader(value = "X-Service-Auth", required = false) String serviceAuth,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        validateServiceAuth(serviceAuth);
        TierResponse response = tierService.decrementQuota(eventId, tierId, request.decrementBy(), idempotencyKey);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{eventId}/tiers/{tierId}/quota/increment")
    @Operation(
        summary = "Incrementar quota de un tier",
        description = "Incrementa la quota disponible de un tier. Uso interno para devolución de inventario al expirar reservation. Requiere X-Service-Auth."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Quota incrementada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "401", description = "X-Service-Auth ausente o incorrecto"),
        @ApiResponse(responseCode = "404", description = "Tier o evento no encontrado")
    })
    public ResponseEntity<TierResponse> incrementTierQuota(
        @PathVariable UUID eventId,
        @PathVariable UUID tierId,
        @Valid @RequestBody IncrementQuotaRequest request,
        @RequestHeader(value = "X-Service-Auth", required = false) String serviceAuth
    ) {
        validateServiceAuth(serviceAuth);
        TierResponse response = tierService.incrementQuota(eventId, tierId, request.incrementBy());
        return ResponseEntity.ok(response);
    }

    private void validateServiceAuth(String serviceAuth) {
        if (serviceAuth == null || !serviceAuth.equals(serviceAuthSecret)) {
            throw new UnauthorizedServiceException("Invalid or missing X-Service-Auth header");
        }
    }
}