# HU-025: Interfaz de Selección de Asientos (SeatMap Frontend)

## Descripción
Como **comprador**, quiero **ver un mapa visual de asientos disponibles** para que **pueda seleccionar asientos específicos antes de pagar** en lugar de solo elegir un nivel de precio.

## Criterios de Aceptación

### CA-1: Visualización de Mapa de Asientos
**Dado** que estoy en la página de compra de entradas de un evento  
**Cuando** el evento tiene tipos de asientos configurados (no solo cuota)  
**Entonces** debo ver:
- Grid visual de asientos organizados por filas/columnas
- Estado de cada asiento: disponible (verde), reservado (gris), vendido (rojo)
- Número de fila y asiento
- Precio del tier asociado
- Capacidad total vs disponibles

### CA-2: Selección de Asientos
**Dado** que veo el mapa de asientos  
**Cuando** hago clic en asientos disponibles  
**Entonces**:
- Se marcan como seleccionados (azules)
- Se muestra count de seleccionados: "X asientos seleccionados"
- Se actualiza subtotal según cantidad de asientos × precio
- Puedo deseleccionar haciendo clic nuevamente

### CA-3: Validación Antes de Reserva
**Dado** que tengo asientos seleccionados  
**Cuando** intento proceder al pago  
**Entonces**:
- Valido que mínimo 1 asiento esté seleccionado
- Muestra error si cantidad no coincide con tier original
- No permite cantidad = 0

### CA-4: Fallback a Modalidad Cuota
**Dado** que el evento NO tiene asientos configurados  
**Cuando** veo la pantalla de compra  
**Entonces**:
- No se muestra SeatMap
- Uso interfaz tradicional (seleccionar cantidad + tier)
- Sistema funciona como antes (backward compatible)

### CA-5: Manejo de Cambios Concurrentes
**Dado** que estoy seleccionando asientos  
**Cuando** otro comprador compra el mismo asiento simultáneamente  
**Entonces**:
- Recibo notificación: "Asiento no disponible, actualizado"
- El mapa reloa estados
- Puedo re-seleccionar otros asientos

## Historias Relacionadas
- HU-024: API Backend de Asientos (COMPLETADA - FASE 1)
- HU-026: Confirmación y Pago con Asientos (siguiente sprint)

## Notas Técnicas
- Endpoint: GET `/api/v1/events/{eventId}/seats?tierId={tierId}`
- Responsabilidad: Frontend solo - no cambios en backend
- Integración: EventDetail.tsx passa eventId/tierId a SeatMap
- Fallback: Si no hay asientos, usar CartFlow tradicional

## Story Points
**13** (incluye componente + integración + tests)

## Definición de Hecho
- [ ] Componente SeatMap.tsx creado
- [ ] CSS Module para estilos
- [ ] Hook useSeatSelection para state management
- [ ] SeatMapService para llamadas API
- [ ] Integración en EventDetail.tsx
- [ ] Tests unitarios 80%+ coverage
- [ ] E2E: Select → Reserve → Pay flow
- [ ] Fallback a cuota sin errors
