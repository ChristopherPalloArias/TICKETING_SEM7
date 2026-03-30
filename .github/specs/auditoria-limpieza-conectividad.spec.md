---
id: SPEC-018
status: IN_PROGRESS
feature: auditoria-limpieza-conectividad
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.1"
related-specs: [SPEC-009, SPEC-010, SPEC-017]
---

# Spec: Auditoría de Limpieza, Conectividad y Funcionalidad

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Correcciones derivadas de una auditoría integral del proyecto: endpoint público de rooms para la vista de venues, selector dinámico de cantidad de entradas en el flujo de compra, botón de reintento de pago desde notificaciones de rechazo, y documentación de deuda técnica (código muerto y endpoints huérfanos).

### Requerimiento de Negocio

Tras una auditoría completa del proyecto SEM7 se identificaron problemas de conectividad (VenuesPage 403), lógica hardcodeada (quantity = 2),inconsistencia de client HTTP (fetch nativo en VenuesPage) y falta de acción de reintento en notificaciones de pago rechazado. Este requerimiento agrupa todas las correcciones necesarias para estabilizar el producto.

### Historias de Usuario

#### HU-AUD-01: Endpoint público de listado de rooms (venues)

```
Como:        Comprador
Quiero:      poder ver la lista de venues sin necesidad de autenticarme como administrador
Para:        explorar los escenarios disponibles y sus eventos próximos desde la vista pública de venues

Prioridad:   Alta
Estimación:  3 SP
Dependencias: Ninguna
Capa:        Ambas (Backend + Frontend)
```

#### Criterios de Aceptación — HU-AUD-01

**Happy Path**
```gherkin
CRITERIO-1.1: Endpoint público de rooms disponible sin autenticación
  Dado que:  ms-events está en ejecución y el API Gateway enruta /api/v1/rooms/public/** hacia ms-events
  Cuando:    el frontend envía GET /api/v1/rooms/public sin headers de autenticación
  Entonces:  el backend responde con status 200
  Y          el body contiene un array de rooms con id, name y maxCapacity
```

```gherkin
CRITERIO-1.2: Gateway redirige peticiones de rooms públicas
  Dado que:  el API Gateway está en ejecución
  Cuando:    el frontend envía GET /api/v1/rooms/public al puerto 8080
  Entonces:  el gateway redirige la petición a ms-events
  Y          la respuesta se retorna al cliente sin modificaciones
```

```gherkin
CRITERIO-1.3: VenuesPage usa el servicio Axios en vez de fetch nativo
  Dado que:  el comprador está en la vista de Venues
  Cuando:    la página carga datos de rooms y eventos
  Entonces:  las peticiones se realizan a través de un servicio en frontend/src/services/ usando Axios
  Y          las peticiones se dirigen al API Gateway (VITE_API_URL)
  Y          no se utiliza fetch() nativo en ningún componente
```

```gherkin
CRITERIO-1.4: VenuesPage muestra los venues con eventos
  Dado que:  el comprador navega a /venues
  Cuando:    la página termina de cargar
  Entonces:  se muestran las tarjetas de venues con su nombre, ciudad, capacidad y descripción
  Y          cada venue muestra la lista de eventos próximos asociados
  Y          cada evento tiene un link a la vista de detalle (/eventos/:id)
```

**Error Path**
```gherkin
CRITERIO-1.5: Estado de error si la API no responde
  Dado que:  el comprador navega a /venues
  Y          el backend no está disponible o responde con error
  Cuando:    la petición falla
  Entonces:  se muestra un mensaje de error amigable
  Y          no se muestra un error técnico ni una pantalla en blanco
```

---

#### HU-AUD-03: Selector de cantidad de entradas en el flujo de compra

```
Como:        Comprador
Quiero:      poder seleccionar cuántas entradas deseo comprar antes de proceder al checkout
Para:        adquirir múltiples entradas en una sola transacción sin estar limitado a una cantidad fija

Prioridad:   Alta
Estimación:  5 SP
Dependencias: HU-04 (ms-ticketing — reservas), SPEC-010 (checkout-pago-frontend)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-AUD-03

**Happy Path**
```gherkin
CRITERIO-3.1: Selector de cantidad visible en el flujo de compra
  Dado que:  el comprador está en la pantalla de detalle de evento y ha seleccionado un tier disponible
  Cuando:    el panel de tickets está visible
  Entonces:  se muestra un selector numérico de cantidad con valor mínimo 1 y máximo según la cuota disponible del tier
  Y          el valor por defecto es 1
```

```gherkin
CRITERIO-3.2: Incremento y decremento de cantidad
  Dado que:  el comprador tiene el selector de cantidad visible
  Cuando:    presiona el botón "+" para incrementar
  Entonces:  la cantidad aumenta en 1 hasta el máximo permitido
  Y          cuando presiona el botón "−" para decrementar
  Entonces:  la cantidad disminuye en 1 hasta un mínimo de 1
```

```gherkin
CRITERIO-3.3: Total recalculado dinámicamente
  Dado que:  el comprador ha seleccionado un tier con precio P y ha seleccionado una cantidad Q
  Cuando:    se navega a la pantalla de checkout
  Entonces:  el subtotal muestra P × Q
  Y          el total muestra (P × Q) + tarifa de servicio
  Y          el resumen del pedido muestra "Qx TIER_TYPE"
```

```gherkin
CRITERIO-3.4: Cantidad propagada a la pantalla de checkout y pago
  Dado que:  el comprador seleccionó 3 entradas VIP
  Cuando:    avanza por checkout → pago → resultado
  Entonces:  el OrderSummary muestra "3x VIP"
  Y          el PaymentPanel calcula el total con quantity = 3
  Y          la pantalla de pago muestra "Total de la reserva por 3 entradas VIP"
```

**Edge Case**
```gherkin
CRITERIO-3.5: Validación de límite por cuota del tier
  Dado que:  el tier seleccionado tiene quota = 5
  Cuando:    el comprador intenta incrementar la cantidad a 6
  Entonces:  el botón "+" se deshabilita
  Y          la cantidad se mantiene en 5
```

```gherkin
CRITERIO-3.6: Cantidad guardada en localStorage con el ticket
  Dado que:  el comprador completó una compra con quantity = 3
  Cuando:    el ticket se guarda para la vista "Mis Tickets"
  Entonces:  el registro almacenado contiene quantity = 3
  Y          la tarjeta en MyTicketsPage muestra "3 entradas"
```

---

#### HU-AUD-04: Botón de reintento de pago desde notificación de rechazo

```
Como:        Comprador
Quiero:      poder volver al flujo de pago directamente desde la notificación de pago rechazado
Para:        reintentar el pago rápidamente sin tener que buscar el evento de nuevo en la cartelera

Prioridad:   Media
Estimación:  3 SP
Dependencias: SPEC-017 (notificaciones-in-app)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-AUD-04

**Happy Path**
```gherkin
CRITERIO-4.1: Botón "Reintentar pago" visible en notificaciones de rechazo
  Dado que:  el comprador tiene una notificación de tipo "payment_rejected" en el panel de notificaciones
  Cuando:    abre el panel de notificaciones
  Entonces:  cada notificación de pago rechazado muestra un botón "Reintentar pago"
  Y          las notificaciones de otros tipos (timer_expired, payment_success) NO muestran dicho botón
```

```gherkin
CRITERIO-4.2: Navegación al detalle del evento desde la notificación
  Dado que:  el comprador ve una notificación de pago rechazado con botón "Reintentar pago"
  Cuando:    hace click en el botón
  Entonces:  se cierra el panel de notificaciones
  Y          el comprador es redirigido a la vista de detalle del evento asociado (/eventos/:eventId)
```

**Error Path**
```gherkin
CRITERIO-4.3: Notificación de expiración NO muestra botón de reintento
  Dado que:  el comprador tiene una notificación de tipo "timer_expired"
  Cuando:    abre el panel de notificaciones
  Entonces:  la notificación de expiración NO muestra ningún botón de acción
  Y          solo muestra el mensaje informativo de que las entradas fueron liberadas
```

```gherkin
CRITERIO-4.4: Notificación de compra exitosa NO muestra botón de reintento
  Dado que:  el comprador tiene una notificación de tipo "payment_success"
  Cuando:    abre el panel de notificaciones
  Entonces:  la notificación de éxito NO muestra el botón "Reintentar pago"
```

---

#### HU-AUD-05: Limpieza de código muerto y endpoints sin uso

```
Como:        Equipo de Desarrollo
Quiero:      documentar los endpoints backend que no tienen consumidor en el frontend y los TODO markers pendientes
Para:        mantener un inventario claro de deuda técnica y planificar su resolución o deprecación

Prioridad:   Baja
Estimación:  2 SP
Dependencias: Ninguna
Capa:        Documentación
```

#### Criterios de Aceptación — HU-AUD-05

**Happy Path**
```gherkin
CRITERIO-5.1: Inventario de endpoints sin consumo en el frontend
  Dado que:  se completa la auditoría del proyecto
  Cuando:    se genera el inventario de deuda técnica
  Entonces:  se documenta que los siguientes endpoints no tienen consumidor en el frontend:
    | Endpoint                             | Microservicio     | Decisión sugerida               |
    | GET /api/v1/tickets/{ticketId}       | ms-ticketing      | Consumir desde MyTicketsPage    |
    | GET /api/v1/notifications/{resId}    | ms-notifications  | Evaluar necesidad o deprecar    |
    | GET /api/v1/rooms/{roomId}           | ms-events         | Evaluar necesidad o deprecar    |
```

```gherkin
CRITERIO-5.2: Inventario de TODO markers en el código
  Dado que:  se completa la auditoría
  Cuando:    se revisan los marcadores TODO
  Entonces:  se documenta que reservationService.ts contiene TODO markers sobre reemplazar el buyerId hardcodeado con el contexto de autenticación
  Y          se asigna como deuda técnica a resolver cuando se implemente autenticación real
```

### Reglas de Negocio

1. El endpoint `GET /api/v1/rooms/public` NO requiere header `X-Role: ADMIN` ni autenticación.
2. El endpoint original `GET /api/v1/rooms` (admin) debe seguir requiriendo `X-Role: ADMIN`.
3. La cantidad mínima seleccionable de entradas es 1; el máximo está limitado por la `quota` disponible del tier.
4. El total del pedido se calcula dinámicamente como `(tierPrice × quantity) + serviceFee`.
5. El botón "Reintentar pago" solo se muestra para notificaciones con `type === 'payment_rejected'`.
6. La navegación desde la notificación requiere `eventId`, que ya existe en `BackendNotification` pero debe mapearse a `AppNotification`.
7. Todas las llamadas HTTP del frontend deben usar Axios a través de la capa `services/`; se prohíbe `fetch()` nativo en componentes.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Room` | tabla `rooms` (ms-events / PostgreSQL) | sin cambios en modelo | Se reutiliza en nuevo endpoint público |
| `AppNotification` | estado in-memory (frontend) | campo `eventId` agregado | Se propaga eventId desde BackendNotification |
| `StoredTicket` | localStorage (frontend) | campo `quantity` ya existente, verificar uso | Registrar cantidad real del ticket |

#### Cambio en `AppNotification` (frontend)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | sí | Identificador único |
| `type` | `NotificationType` | sí | `timer_expired` \| `payment_rejected` \| `payment_success` |
| `title` | string | sí | Título de la notificación |
| `message` | string | sí | Cuerpo del mensaje |
| `eventTitle` | string | sí | Nombre del evento |
| `timestamp` | Date | sí | Timestamp de creación |
| `read` | boolean | sí | Si fue leída |
| `reservationId` | string | no | ID de reserva asociada |
| **`eventId`** | **string** | **no** | **ID del evento asociado (nuevo — mapeado desde `BackendNotification.eventId`)** |

### API Endpoints

#### GET /api/v1/rooms/public (nuevo — ms-events)

- **Descripción**: Lista rooms disponibles sin requerir autenticación admin
- **Auth requerida**: no
- **Controller**: `RoomController` (ms-events)
- **Service**: reutiliza `RoomService.getAllRooms()`
- **Response 200**:
  ```json
  [
    {
      "id": 1,
      "name": "Sala Principal",
      "maxCapacity": 500,
      "location": "Bogotá",
      "description": "Sala central del teatro"
    }
  ]
  ```
- **Response 500**: error interno del servidor

#### Ruta API Gateway (nueva)

| Route ID | URI | Predicate | Destino |
|----------|-----|-----------|---------|
| `ms-events-rooms-public` | `${MS_EVENTS_URL}` | `Path=/api/v1/rooms/public/**` | ms-events |

> **Nota**: La ruta pública debe declararse **antes** de la ruta existente `/api/v1/rooms/**` para que Spring Cloud Gateway la resuelva primero, o bien la ruta catch-all `/api/v1/rooms/**` ya cubrirá `/api/v1/rooms/public`. Verificar orden en `application.yml`.

### Diseño Frontend

#### Componentes nuevos

| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `QuantitySelector` | `components/QuantitySelector/QuantitySelector.tsx` | `value, min, max, onChange` | Selector numérico con botones +/− |

#### Componentes modificados

| Componente | Archivo | Cambio |
|------------|---------|--------|
| `VenuesPage` | `pages/VenuesPage/VenuesPage.tsx` | Reemplazar `fetch()` nativo por `venueService` (Axios) |
| `EventDetail` | `pages/EventDetail/EventDetail.tsx` | Agregar estado `quantity`, renderizar `QuantitySelector`, eliminar `const quantity = 2` |
| `CheckoutScreen` | `pages/EventDetail/screens/CheckoutScreen.tsx` | Recibir `quantity` como prop, eliminar `quantity={2}` hardcodeado |
| `OrderSummary` | `pages/EventDetail/screens/OrderSummary.tsx` | Mostrar `{quantity}x {tierName}`, calcular total dinámicamente |
| `PaymentPanel` | `pages/EventDetail/screens/PaymentPanel.tsx` | Usar `quantity` prop para calcular total |
| `NotificationsPanel` | `components/NavBar/NotificationsPanel.tsx` | Agregar botón "Reintentar pago" para `payment_rejected` |
| `NotificationsContext` | `contexts/NotificationsContext.tsx` | Mapear `BackendNotification.eventId` a `AppNotification.eventId` |

#### Services nuevos

| Función | Archivo | Endpoint |
|---------|---------|---------|
| `getPublicRooms()` | `services/venueService.ts` | `GET /api/v1/rooms/public` |

#### Services existentes reutilizados

| Función | Archivo | Uso |
|---------|---------|-----|
| `getEvents()` | `services/eventService.ts` | VenuesPage carga eventos asociados a rooms |

#### Hooks y State

| Ubicación | Cambio | Descripción |
|-----------|--------|-------------|
| `EventDetail.tsx` | `const [quantity, setQuantity] = useState(1)` | Estado local de cantidad seleccionada |
| `VenuesPage.tsx` | Consumir `venueService.getPublicRooms()` | Reemplazar fetch nativo |

### Arquitectura y Dependencias

- **Paquetes nuevos requeridos**: ninguno
- **Servicios externos**: ninguno nuevo
- **Impacto en punto de entrada de la app**: ninguno (rutas de VenuesPage y notificaciones ya existen)
- **API Gateway**: agregar ruta para `/api/v1/rooms/public/**` o verificar que la ruta catch-all `/api/v1/rooms/**` ya la cubre

### Notas de Implementación

1. **Backend (ms-events)**: El nuevo endpoint `GET /api/v1/rooms/public` debe declararse en el mismo `RoomController`. La diferencia con el existente `GET /api/v1/rooms` es que NO valida el header `X-Role`. Reutilizar `roomService.getAllRooms()`.

2. **API Gateway**: La ruta existente `Path=/api/v1/rooms/**` ya cubre `/api/v1/rooms/public`. Verificar que funciona sin necesidad de una ruta adicional. Si hay filtros de autenticación en el gateway, asegurar que `/api/v1/rooms/public` esté excluida.

3. **QuantitySelector**: Componente stateless controlado. Renderizar junto al botón "Reservar" en `EventDetail`. El `max` se calcula desde `tier.quota` (cuota disponible del tier seleccionado).

4. **Propagación de quantity**: `EventDetail` → `CheckoutScreen` → `OrderSummary` + `PaymentPanel`. Eliminar TODOS los hardcodes de `quantity = 2` identificados en `EventDetail.tsx` (línea 96), `CheckoutScreen.tsx` (líneas 62 y 90).

5. **NotificationsPanel**: `BackendNotification` ya incluye `eventId`. Solo falta mapearlo a `AppNotification` en `NotificationsContext.tsx` y consumirlo en `NotificationsPanel.tsx` para navegar con `useNavigate()`.

6. **HU-AUD-05 (documentación)**: No requiere cambios de código. Generar un ADR o documento en `docs/` con el inventario de deuda técnica.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### Implementación — HU-AUD-01
- [ ] Crear endpoint `GET /api/v1/rooms/public` en `RoomController` que no requiera `X-Role: ADMIN`
- [ ] Reutilizar `RoomService.getAllRooms()` en el nuevo endpoint
- [ ] Verificar/agregar ruta `/api/v1/rooms/public/**` en la configuración del API Gateway (`api-gateway/src/main/resources/application.yml`)

#### Tests Backend — HU-AUD-01
- [ ] `test_rooms_public_endpoint_returns_200_without_auth` — GET /api/v1/rooms/public sin headers devuelve 200
- [ ] `test_rooms_admin_endpoint_still_requires_role` — GET /api/v1/rooms sin X-Role: ADMIN devuelve 403
- [ ] `test_rooms_public_endpoint_returns_room_list` — respuesta contiene array de rooms con id, name, maxCapacity

### Frontend

#### Implementación — HU-AUD-01 (VenuesPage + venueService)
- [ ] Crear `venueService.ts` en `frontend/src/services/` con función `getPublicRooms()` usando Axios
- [ ] Refactorizar `VenuesPage.tsx` para usar `venueService.getPublicRooms()` en vez de `fetch()` nativo
- [ ] Apuntar la llamada de rooms a `/api/v1/rooms/public`
- [ ] Reutilizar `getEvents()` de `eventService.ts` para cargar eventos (ya usa Axios)
- [ ] Mantener manejo de errores con mensaje amigable al usuario

#### Implementación — HU-AUD-03 (Selector de cantidad)
- [ ] Crear componente `QuantitySelector` con botones +/−, display numérico, y CSS Modules
- [ ] Agregar estado `quantity` en `EventDetail.tsx`, inicializado en 1
- [ ] Renderizar `QuantitySelector` junto al CTA "Reservar" en `EventDetail.tsx`
- [ ] Eliminar `const quantity = 2` hardcodeado en `EventDetail.tsx` (línea ~96)
- [ ] Propagar `quantity` como prop a `CheckoutScreen`
- [ ] Eliminar `quantity={2}` hardcodeado en `CheckoutScreen.tsx` (líneas ~62 y ~90)
- [ ] Propagar `quantity` a `OrderSummary` y `PaymentPanel`
- [ ] Recalcular `total = tierPrice * quantity + serviceFee` dinámicamente en `OrderSummary`
- [ ] Limitar el máximo del selector a `tier.quota` (cuota disponible del tier)
- [ ] Actualizar textos que referencian la cantidad ("2 entradas" → dinámico basado en `quantity`)
- [ ] Actualizar `StoredTicket` / `ticketsStorage` para reflejar la cantidad real al guardar

#### Implementación — HU-AUD-04 (Botón reintento de pago)
- [ ] Agregar campo `eventId` a la interfaz `AppNotification` en `NotificationsContext.tsx`
- [ ] Mapear `BackendNotification.eventId` a `AppNotification.eventId` en la función de transformación
- [ ] Propagar `eventId` desde notificaciones locales (`addNotification`) cuando aplique
- [ ] Agregar botón "Reintentar pago" en `NotificationsPanel.tsx` solo para items con `type === 'payment_rejected'`
- [ ] Implementar navegación programática con `useNavigate()` a `/eventos/${notification.eventId}` al hacer click
- [ ] Cerrar el panel de notificaciones al hacer click en el botón de reintento
- [ ] Estilizar el botón de reintento con CSS Modules, consistente con el diseño Teatro Noir

#### Tests Frontend — HU-AUD-01
- [ ] `VenuesPage renders venue cards with data from venueService`
- [ ] `VenuesPage shows error message when API fails`
- [ ] `venueService.getPublicRooms calls correct endpoint with Axios`

#### Tests Frontend — HU-AUD-03
- [ ] `QuantitySelector renders with default value 1`
- [ ] `QuantitySelector increments quantity on + click`
- [ ] `QuantitySelector decrements quantity on − click`
- [ ] `QuantitySelector disables + button at max value`
- [ ] `QuantitySelector disables − button at min value (1)`
- [ ] `OrderSummary displays correct total for given quantity`
- [ ] `CheckoutScreen propagates quantity to OrderSummary and PaymentPanel`
- [ ] `EventDetail initializes quantity to 1 and passes to checkout`

#### Tests Frontend — HU-AUD-04
- [ ] `NotificationsPanel shows retry button for payment_rejected`
- [ ] `NotificationsPanel hides retry button for timer_expired`
- [ ] `NotificationsPanel hides retry button for payment_success`
- [ ] `NotificationsPanel navigates to event detail on retry click`
- [ ] `NotificationsPanel closes panel on retry button click`

### QA

- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CRITERIO-1.1 a 1.5, 3.1 a 3.6, 4.1 a 4.4, 5.1 a 5.2
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Verificar que `GET /api/v1/rooms/public` responde 200 sin headers de autenticación
- [ ] Verificar que el endpoint admin `GET /api/v1/rooms` sigue requiriendo `X-Role: ADMIN`
- [ ] Verificar que la vista de Venues carga y muestra datos correctamente vía Axios
- [ ] Verificar valor por defecto de cantidad = 1 en selector
- [ ] Verificar incremento/decremento con botones +/−
- [ ] Verificar que no se puede exceder la quota del tier ni bajar de 1
- [ ] Verificar que el total se recalcula dinámicamente en checkout y pago
- [ ] Verificar que la cantidad correcta se guarda en el ticket (StoredTicket)
- [ ] Verificar que el botón "Reintentar pago" aparece solo en notificaciones `payment_rejected`
- [ ] Verificar que el click navega a `/eventos/:eventId` correcto
- [ ] Verificar que el panel se cierra tras hacer click en reintento
- [ ] Verificar que notificaciones `timer_expired` y `payment_success` NO tienen botón de reintento
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar que todas las reglas de negocio están cubiertas

### Documentación — HU-AUD-05

- [ ] Crear documento de inventario de deuda técnica en `docs/` con endpoints huérfanos y plan de acción
- [ ] Documentar TODO markers pendientes en `reservationService.ts` (buyerId hardcodeado)
- [ ] Agregar labels de deuda técnica en el backlog del proyecto
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
