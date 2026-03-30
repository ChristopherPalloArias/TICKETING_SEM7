# Escenarios Gherkin — SPEC-018: Auditoría de Limpieza, Conectividad y Funcionalidad

> **Spec:** `.github/specs/auditoria-limpieza-conectividad.spec.md`
> **Generado por:** QA Agent · gherkin-case-generator
> **Fecha:** 2026-03-30
> **Criterios cubiertos:** CRITERIO-1.1 a 1.5, CRITERIO-3.1 a 3.6, CRITERIO-4.1 a 4.4, CRITERIO-5.1 a 5.2

---

## Resumen de flujos críticos

| # | Flujo | HU | Tipo | Tags |
|---|-------|----|------|------|
| F-01 | Endpoint público de rooms sin autenticación | HU-AUD-01 | Happy path | `@smoke @critico` |
| F-02 | Gateway redirige rooms públicas | HU-AUD-01 | Happy path | `@smoke @integracion` |
| F-03 | VenuesPage consume servicio Axios | HU-AUD-01 | Happy path | `@critico` |
| F-04 | VenuesPage muestra venues con eventos | HU-AUD-01 | Happy path | `@smoke @critico` |
| F-05 | VenuesPage maneja error de API | HU-AUD-01 | Error path | `@error-path` |
| F-06 | Selector de cantidad visible con valor por defecto | HU-AUD-03 | Happy path | `@smoke @critico` |
| F-07 | Incremento y decremento de cantidad | HU-AUD-03 | Happy path | `@critico` |
| F-08 | Total recalculado dinámicamente | HU-AUD-03 | Happy path | `@smoke @critico` |
| F-09 | Cantidad propagada a checkout y pago | HU-AUD-03 | Happy path | `@critico` |
| F-10 | Validación de límite por quota del tier | HU-AUD-03 | Edge case | `@edge-case` |
| F-11 | Cantidad guardada en localStorage | HU-AUD-03 | Edge case | `@edge-case` |
| F-12 | Botón "Reintentar pago" en notificaciones de rechazo | HU-AUD-04 | Happy path | `@smoke @critico` |
| F-13 | Navegación al detalle desde notificación | HU-AUD-04 | Happy path | `@critico` |
| F-14 | Notificación expiración sin botón reintento | HU-AUD-04 | Error path | `@error-path @seguridad` |
| F-15 | Notificación éxito sin botón reintento | HU-AUD-04 | Error path | `@error-path` |
| F-16 | Inventario endpoints sin consumo | HU-AUD-05 | Documentación | `@documentacion` |
| F-17 | Inventario TODO markers | HU-AUD-05 | Documentación | `@documentacion` |

---

## HU-AUD-01: Endpoint público de listado de rooms (venues)

```gherkin
#language: es
Característica: Listado público de venues y eventos

  Contexto:
    Dado que el sistema de ticketing está en ejecución
    Y el API Gateway enruta peticiones hacia ms-events

  @smoke @critico @CRITERIO-1.1
  Escenario: Endpoint público de rooms responde sin autenticación
    Dado que ms-events tiene rooms registrados en la base de datos
    Cuando un comprador envía una petición al listado público de rooms sin credenciales
    Entonces el sistema responde exitosamente con código 200
    Y el cuerpo de la respuesta contiene un listado de rooms
    Y cada room incluye identificador, nombre y capacidad máxima

  @smoke @integracion @CRITERIO-1.2
  Escenario: Gateway redirige peticiones de rooms públicas a ms-events
    Dado que el API Gateway está en ejecución en el puerto 8080
    Cuando el frontend envía una petición de rooms públicas al gateway
    Entonces el gateway redirige la petición a ms-events
    Y la respuesta se retorna al cliente sin modificaciones

  @critico @CRITERIO-1.3
  Escenario: VenuesPage utiliza servicio Axios en vez de fetch nativo
    Dado que el comprador está en la vista de Venues
    Cuando la página solicita datos de rooms y eventos
    Entonces las peticiones se realizan a través del servicio venueService usando Axios
    Y las peticiones se dirigen al API Gateway configurado en VITE_API_URL
    Y no se utiliza fetch() nativo en ningún componente de la vista

  @smoke @critico @CRITERIO-1.4
  Escenario: VenuesPage muestra las tarjetas de venues con sus eventos
    Dado que el comprador navega a la sección de Venues
    Y existen 2 venues registrados: "Teatro Real" y "Grand Opera House"
    Y el venue "Teatro Real" tiene el evento "Hamlet" próximamente
    Cuando la página termina de cargar
    Entonces se muestran las tarjetas de venues con nombre y capacidad
    Y el venue "Teatro Real" muestra el evento "Hamlet" en su listado
    Y cada evento tiene un enlace a la vista de detalle del evento

  @error-path @CRITERIO-1.5
  Escenario: Mensaje de error amigable cuando la API no responde
    Dado que el comprador navega a la sección de Venues
    Y el backend no está disponible o responde con error
    Cuando la petición de rooms falla
    Entonces se muestra un mensaje indicando "No se pudieron cargar los venues"
    Y no se muestra un error técnico ni una pantalla en blanco
    Y no se muestran tarjetas de venues

  @error-path @seguridad @CRITERIO-1.1
  Escenario: Endpoint admin de rooms sigue requiriendo autenticación
    Dado que ms-events está en ejecución
    Cuando un usuario envía una petición al listado administrador de rooms sin el rol ADMIN
    Entonces el sistema responde con código 403 Prohibido
    Y no se exponen datos de rooms sin la autorización correcta
```

---

## HU-AUD-03: Selector de cantidad de entradas en el flujo de compra

```gherkin
#language: es
Característica: Selector dinámico de cantidad de entradas

  Contexto:
    Dado que el comprador está en la pantalla de detalle del evento "Hamlet"
    Y el evento tiene un tier "VIP" con precio $150.000 y cuota disponible de 10 entradas

  @smoke @critico @CRITERIO-3.1
  Escenario: Selector de cantidad visible con valor por defecto
    Dado que el comprador ha seleccionado el tier "VIP"
    Cuando el panel de tickets se muestra en pantalla
    Entonces se muestra un selector numérico de cantidad con etiqueta "Cantidad"
    Y el valor por defecto del selector es 1
    Y el valor mínimo es 1
    Y el valor máximo corresponde a la cuota disponible del tier (10)

  @critico @CRITERIO-3.2
  Esquema del escenario: Incremento y decremento de cantidad
    Dado que el selector de cantidad muestra el valor <valor_inicial>
    Cuando el comprador presiona el botón "<accion>"
    Entonces la cantidad cambia a <valor_esperado>
    Ejemplos:
      | valor_inicial | accion | valor_esperado |
      | 1             | +      | 2              |
      | 5             | +      | 6              |
      | 3             | −      | 2              |
      | 2             | −      | 1              |

  @smoke @critico @CRITERIO-3.3
  Esquema del escenario: Total recalculado dinámicamente según cantidad
    Dado que el comprador seleccionó el tier "<tier>" con precio <precio>
    Y seleccionó una cantidad de <cantidad> entradas
    Cuando navega a la pantalla de checkout
    Entonces el resumen del pedido muestra "<cantidad>x <tier>"
    Y el subtotal muestra $<subtotal>
    Y el total incluye la tarifa de servicio
    Ejemplos:
      | tier    | precio  | cantidad | subtotal |
      | VIP     | 150000  | 1        | 150000   |
      | VIP     | 150000  | 3        | 450000   |
      | GENERAL | 80000   | 2        | 160000   |
      | GENERAL | 80000   | 5        | 400000   |

  @critico @CRITERIO-3.4
  Escenario: Cantidad propagada a checkout, resumen y panel de pago
    Dado que el comprador seleccionó 3 entradas VIP a $150.000 cada una
    Cuando avanza por el flujo checkout → pago → resultado
    Entonces el OrderSummary muestra "3x VIP"
    Y el PaymentPanel calcula el total con quantity = 3
    Y la pantalla de pago muestra el total de la reserva por 3 entradas VIP

  @edge-case @CRITERIO-3.5
  Esquema del escenario: Validación de límites del selector
    Dado que el tier seleccionado tiene una cuota disponible de <quota> entradas
    Y el selector muestra el valor <valor_actual>
    Cuando el comprador intenta presionar el botón "<boton>"
    Entonces el botón "<boton>" está <estado>
    Y la cantidad se mantiene en <valor_final>
    Ejemplos:
      | quota | valor_actual | boton | estado       | valor_final |
      | 5     | 5            | +     | deshabilitado | 5          |
      | 10    | 10           | +     | deshabilitado | 10         |
      | 5     | 1            | −     | deshabilitado | 1          |
      | 5     | 3            | +     | habilitado    | 4          |
      | 5     | 3            | −     | habilitado    | 2          |

  @edge-case @CRITERIO-3.6
  Escenario: Cantidad guardada correctamente en localStorage con el ticket
    Dado que el comprador completó una compra de 3 entradas VIP
    Cuando el ticket se confirma y se guarda para "Mis Tickets"
    Entonces el registro almacenado en localStorage contiene quantity = 3
    Y la tarjeta en la vista de Mis Tickets muestra "3 entradas"
```

---

## HU-AUD-04: Botón de reintento de pago desde notificación de rechazo

```gherkin
#language: es
Característica: Reintento de pago desde notificaciones

  Contexto:
    Dado que el comprador tiene notificaciones en el panel de notificaciones

  @smoke @critico @CRITERIO-4.1
  Escenario: Botón "Reintentar pago" visible solo en notificaciones de rechazo
    Dado que el comprador tiene una notificación de tipo "pago rechazado" para el evento "Hamlet"
    Cuando abre el panel de notificaciones
    Entonces la notificación de pago rechazado muestra un botón "Reintentar pago"

  @critico @CRITERIO-4.2
  Escenario: Navegación al detalle del evento desde la notificación
    Dado que el comprador ve una notificación de pago rechazado para el evento con id "evt-42"
    Y la notificación muestra el botón "Reintentar pago"
    Cuando hace click en el botón "Reintentar pago"
    Entonces se cierra el panel de notificaciones
    Y el comprador es redirigido a la vista de detalle del evento "/eventos/evt-42"

  @error-path @seguridad @CRITERIO-4.3
  Escenario: Notificación de expiración NO muestra botón de reintento
    Dado que el comprador tiene una notificación de tipo "tiempo agotado"
    Cuando abre el panel de notificaciones
    Entonces la notificación de expiración NO muestra ningún botón de acción
    Y solo muestra el mensaje informativo de que las entradas fueron liberadas

  @error-path @CRITERIO-4.4
  Escenario: Notificación de compra exitosa NO muestra botón de reintento
    Dado que el comprador tiene una notificación de tipo "pago exitoso"
    Cuando abre el panel de notificaciones
    Entonces la notificación de éxito NO muestra el botón "Reintentar pago"

  @edge-case @CRITERIO-4.1 @CRITERIO-4.2
  Escenario: Múltiples notificaciones de rechazo muestran botón individualmente
    Dado que el comprador tiene 2 notificaciones de pago rechazado para eventos distintos
    Y tiene 1 notificación de pago exitoso
    Cuando abre el panel de notificaciones
    Entonces cada notificación de rechazo muestra su propio botón "Reintentar pago"
    Y la notificación de éxito no muestra botón
    Y cada botón navega al evento correcto correspondiente
```

---

## HU-AUD-05: Limpieza de código muerto y endpoints sin uso

```gherkin
#language: es
Característica: Documentación de deuda técnica

  @documentacion @CRITERIO-5.1
  Escenario: Inventario de endpoints backend sin consumidor en el frontend
    Dado que se completó la auditoría del proyecto
    Cuando se genera el inventario de deuda técnica
    Entonces se documenta que los siguientes endpoints no tienen consumidor:
      | Endpoint                          | Microservicio    | Decisión sugerida            |
      | GET /api/v1/tickets/{ticketId}    | ms-ticketing     | Consumir desde MyTicketsPage |
      | GET /api/v1/notifications/{resId} | ms-notifications | Evaluar necesidad o deprecar |
      | GET /api/v1/rooms/{roomId}        | ms-events        | Evaluar necesidad o deprecar |

  @documentacion @CRITERIO-5.2
  Escenario: Inventario de TODO markers pendientes en el código
    Dado que se completó la auditoría
    Cuando se revisan los marcadores TODO en el código fuente
    Entonces se documenta que reservationService.ts contiene TODO markers
    Y los markers indican el reemplazo del buyerId hardcodeado con contexto de autenticación
    Y se asigna como deuda técnica a resolver con la implementación de autenticación real
```

---

## Datos de prueba sintéticos

### HU-AUD-01: Rooms y Venues

| Escenario | Campo | Válido | Inválido | Borde |
|-----------|-------|--------|----------|-------|
| Listado público | rooms API response | `[{id: "room-1", name: "Teatro Real", maxCapacity: 500}]` | `500 Internal Server Error` | `[]` (array vacío) |
| Headers auth | X-Role header (admin) | `X-Role: ADMIN` | `X-Role: USER` / sin header | — |
| Axios URL | VITE_API_URL | `http://localhost:8080` | `undefined` / URL malformada | — |

### HU-AUD-03: Selector de cantidad

| Escenario | Campo | Válido | Inválido | Borde |
|-----------|-------|--------|----------|-------|
| Selector quantity | value | `1`, `3`, `5` | `0`, `-1` | `1` (min), `quota` (max) |
| Tier precio | price | `"150000"`, `"80000"` | `"0"`, `null` | `"1"` |
| Tier quota | quota | `10`, `50` | `0` | `1` (min posible) |
| Total cálculo | quantity × price | `3 × 150000 = 450000` | — | `1 × 1 = 1` |

### HU-AUD-04: Notificaciones de reintento

| Escenario | Campo | Válido | Inválido | Borde |
|-----------|-------|--------|----------|-------|
| Notification type | type | `"payment_rejected"` | `"timer_expired"`, `"payment_success"` | — |
| Event ID | eventId | `"evt-42"` | `undefined`, `null` | `""` (string vacío) |
| Navegación URL | route | `/eventos/evt-42` | — | `/eventos/undefined` |

---

## Trazabilidad: Criterios → Escenarios → Tags

| Criterio | Escenario Gherkin | Tags |
|----------|-------------------|------|
| CRITERIO-1.1 | Endpoint público responde sin auth + Admin sigue requiriendo auth | `@smoke @critico` `@seguridad` |
| CRITERIO-1.2 | Gateway redirige rooms públicas | `@smoke @integracion` |
| CRITERIO-1.3 | VenuesPage usa Axios | `@critico` |
| CRITERIO-1.4 | VenuesPage muestra tarjetas con eventos | `@smoke @critico` |
| CRITERIO-1.5 | Mensaje de error amigable | `@error-path` |
| CRITERIO-3.1 | Selector visible con valor por defecto | `@smoke @critico` |
| CRITERIO-3.2 | Incremento y decremento | `@critico` |
| CRITERIO-3.3 | Total recalculado dinámicamente | `@smoke @critico` |
| CRITERIO-3.4 | Cantidad propagada a checkout | `@critico` |
| CRITERIO-3.5 | Validación de límites del selector | `@edge-case` |
| CRITERIO-3.6 | Cantidad guardada en localStorage | `@edge-case` |
| CRITERIO-4.1 | Botón "Reintentar pago" visible en rechazos | `@smoke @critico` |
| CRITERIO-4.2 | Navegación al detalle del evento | `@critico` |
| CRITERIO-4.3 | Expiración sin botón reintento | `@error-path @seguridad` |
| CRITERIO-4.4 | Éxito sin botón reintento | `@error-path` |
| CRITERIO-5.1 | Inventario endpoints sin consumo | `@documentacion` |
| CRITERIO-5.2 | Inventario TODO markers | `@documentacion` |
