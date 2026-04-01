---
id: SPEC-022
status: IMPLEMENTED
feature: sprint3-metricas-salas-navegacion-hardening
created: 2026-03-31
updated: 2026-04-02
author: spec-generator
version: "1.0"
related-specs: [SPEC-020, SPEC-021]
---

# Spec: Sprint 3 — Métricas, Salas, Navegación, Hardening

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Completar el panel de administración con dashboard de métricas, CRUD de salas, navegación con sidebar; implementar vista real de tickets, descarga en PDF, asociación de tickets anónimos y perfil básico; y cerrar con headers de seguridad HTTP y hardening general.

### Requerimiento de Negocio
El administrador carece de visibilidad sobre tickets vendidos, ingresos y ocupación. Las salas solo se pueden crear (no editar ni eliminar). La navegación del panel es mínima. Los compradores registrados no pueden ver sus tickets ni descargarlos. Faltan headers de seguridad estándar en las respuestas HTTP del gateway.

### Historias de Usuario

#### HU-TKT-01: Vista real de tickets del usuario autenticado

```
Como:        Comprador autenticado
Quiero:      ver mis tickets confirmados en una sección dedicada
Para:        tener acceso a todas mis compras desde mi cuenta

Prioridad:   Alta
Estimación:  M (5 SP)
Dependencias: HU-SEC-01, HU-SEC-02 (SPEC-020), HU-04 (SPEC-004)
Capa:        Ambas (ms-ticketing + frontend)
```

#### Criterios de Aceptación — HU-TKT-01

**Happy Path**
```gherkin
CRITERIO-TKT1.1: Lista real de tickets del usuario autenticado
  Dado que:  el comprador está autenticado con JWT válido (role BUYER)
  Cuando:    navega a "/mis-tickets"
  Entonces:  el sistema consulta GET /api/v1/tickets?buyerId={userId}
  Y muestra los tickets reales confirmados asociados a su cuenta
  Y NO usa localStorage ni datos mock
  Y cada ticket muestra: evento, fecha, tier, precio pagado y estado
  Y están ordenados por fecha de compra descendente
```

**Edge Case**
```gherkin
CRITERIO-TKT1.2: Estado vacío cuando no hay tickets
  Dado que:  el comprador está autenticado pero no ha comprado entradas
  Cuando:    navega a "/mis-tickets"
  Entonces:  ve un mensaje "Aún no tienes tickets"
  Y un botón "Ver cartelera" que lo lleva a /events
```

```gherkin
CRITERIO-TKT1.3: Ticket muestra información completa del evento
  Dado que:  el comprador tiene tickets confirmados
  Cuando:    ve la lista de sus tickets
  Entonces:  cada ticket muestra: título del evento, fecha y hora, tier, precio pagado, estado (VALID o CANCELLED), fecha de compra
```

---

#### HU-TKT-03: Descarga de ticket en PDF

```
Como:        Comprador
Quiero:      descargar mi ticket confirmado como archivo PDF
Para:        tener una copia física o digital de mi entrada al evento

Prioridad:   Alta
Estimación:  S (3 SP)
Dependencias: HU-04 (SPEC-004), HU-TKT-01
Capa:        Ambas (ms-ticketing + frontend)
```

#### Criterios de Aceptación — HU-TKT-03

**Happy Path**
```gherkin
CRITERIO-TKT3.1: Descarga desde detalle del ticket
  Dado que:  el comprador tiene un ticket confirmado
  Cuando:    hace clic en el botón "Descargar Ticket"
  Entonces:  el sistema genera un PDF con la información del ticket
  Y el archivo se descarga automáticamente con nombre "ticket-{ticketId}.pdf"
```

```gherkin
CRITERIO-TKT3.2: Contenido del PDF
  Dado que:  se descarga un ticket
  Cuando:    el comprador abre el archivo PDF
  Entonces:  contiene: título del evento, fecha y hora, sala, tier, precio pagado, ID del ticket (UUID), email/nombre del comprador
```

**Error Path**
```gherkin
CRITERIO-TKT3.3: Ticket cancelado no se puede descargar
  Dado que:  un ticket tiene estado CANCELLED
  Cuando:    el comprador intenta descargarlo
  Entonces:  el botón de descarga está deshabilitado
  Y muestra el mensaje "Este ticket fue cancelado"
```

---

#### HU-TKT-02: Asociación de tickets anónimos al registrarse

```
Como:        Comprador
Quiero:      que al crear mi cuenta con el mismo email con el que compré tickets anónimamente, esos tickets queden asociados a mi nueva cuenta
Para:        no perder el historial de compras realizadas antes de registrarme

Prioridad:   Media
Estimación:  M (5 SP)
Dependencias: HU-SEC-03 (SPEC-021), HU-TKT-01
Capa:        Backend (api-gateway, ms-ticketing)
```

#### Criterios de Aceptación — HU-TKT-02

**Happy Path**
```gherkin
CRITERIO-TKT2.1: Tickets anónimos asociados al registrarse
  Dado que:  existe un ticket confirmado con buyer_email "juan@email.com" comprado de forma anónima
  Cuando:    Juan se registra con el email "juan@email.com"
  Entonces:  el sistema busca tickets con buyer_email = "juan@email.com"
  Y asocia esos tickets al nuevo userId de Juan
  Y los tickets aparecen en su sección "/mis-tickets"
```

**Edge Case**
```gherkin
CRITERIO-TKT2.2: Registro sin compras previas no falla
  Dado que:  no existe ningún ticket con el email de registro
  Cuando:    el usuario se registra
  Entonces:  el registro es exitoso sin errores
  Y la sección "/mis-tickets" aparece vacía
```

```gherkin
CRITERIO-TKT2.3: La asociación no duplica tickets
  Dado que:  el usuario ya tiene algunos tickets asociados a su cuenta
  Y tiene otros tickets anónimos con el mismo email
  Cuando:    el sistema ejecuta la asociación
  Entonces:  solo asocia los tickets que aún no tienen userId asignado
  Y no duplica tickets ya asociados
```

---

#### HU-ADM-03: Dashboard con métricas y analítica básica

```
Como:        Administrador
Quiero:      ver métricas clave sobre mis eventos en el dashboard
Para:        tomar decisiones informadas sobre la gestión de eventos

Prioridad:   Media
Estimación:  M (5 SP)
Dependencias: Ninguna
Capa:        Ambas (ms-events, ms-ticketing, frontend)
```

#### Criterios de Aceptación — HU-ADM-03

**Happy Path**
```gherkin
CRITERIO-ADM3.1: Tarjetas de resumen en el dashboard
  Dado que:  el administrador está en el dashboard "/admin/events"
  Cuando:    la página carga
  Entonces:  muestra tarjetas con: Total Eventos, Eventos Publicados, Tickets Vendidos (total), Reservas Activas
```

```gherkin
CRITERIO-ADM3.2: Métricas por evento en la tabla
  Dado que:  el administrador ve la tabla de eventos
  Cuando:    revisa las columnas
  Entonces:  cada evento muestra: Tickets vendidos / Aforo total (con barra de progreso), Reservas activas, Ingresos estimados
```

```gherkin
CRITERIO-ADM3.3: Búsqueda y paginación
  Dado que:  existen más de 10 eventos
  Cuando:    el administrador usa la barra de búsqueda
  Entonces:  puede filtrar por título del evento
  Y la tabla muestra paginación con 10 eventos por página
```

---

#### HU-ADM-04: Gestión de salas (CRUD)

```
Como:        Administrador
Quiero:      gestionar las salas del sistema (crear, editar, ver, eliminar)
Para:        mantener actualizado el catálogo de espacios disponibles para eventos

Prioridad:   Media
Estimación:  M (5 SP)
Dependencias: Ninguna
Capa:        Ambas (ms-events + frontend)
```

#### Criterios de Aceptación — HU-ADM-04

**Happy Path**
```gherkin
CRITERIO-ADM4.1: Listado de salas
  Dado que:  el administrador navega a "/admin/rooms"
  Cuando:    la página carga
  Entonces:  muestra una tabla con todas las salas
  Y cada fila muestra: nombre, capacidad máxima, cantidad de eventos asociados
```

```gherkin
CRITERIO-ADM4.2: Creación de sala
  Dado que:  el administrador está en "/admin/rooms"
  Cuando:    hace clic en "Crear Sala", llena nombre y capacidad máxima
  Entonces:  el sistema crea la sala y aparece en la tabla
```

```gherkin
CRITERIO-ADM4.3: Edición de sala
  Dado que:  existe una sala "Sala Principal" con capacidad 500
  Cuando:    el administrador edita la capacidad a 600
  Entonces:  el sistema actualiza la sala
  Y los eventos futuros pueden usar la nueva capacidad
```

**Error Path**
```gherkin
CRITERIO-ADM4.4: Sala con eventos asociados no se puede eliminar
  Dado que:  existe una sala con eventos en estado DRAFT o PUBLISHED
  Cuando:    el administrador intenta eliminar la sala
  Entonces:  el sistema rechaza la eliminación
  Y muestra un mensaje indicando los eventos asociados
```

---

#### HU-ADM-05: Navegación mejorada del panel de administración

```
Como:        Administrador
Quiero:      una navegación más completa y organizada en el panel de administración
Para:        acceder rápidamente a todas las funcionalidades de gestión

Prioridad:   Media
Estimación:  S (3 SP)
Dependencias: Ninguna
Capa:        Frontend
```

#### Criterios de Aceptación — HU-ADM-05

**Happy Path**
```gherkin
CRITERIO-ADM5.1: Sidebar con secciones del panel
  Dado que:  el administrador está en el panel de administración
  Cuando:    ve la interfaz
  Entonces:  existe un sidebar (lateral izquierdo) con: Dashboard (/admin/events), Eventos (/admin/events), Salas (/admin/rooms)
  Y la sección activa está resaltada visualmente
  Y el sidebar es colapsable en pantallas pequeñas
```

```gherkin
CRITERIO-ADM5.2: Header mejorado con información contextual
  Dado que:  el administrador está autenticado
  Cuando:    ve el header del panel
  Entonces:  muestra: nombre/email del admin, botón de cerrar sesión
  Y no muestra credenciales en texto plano
```

```gherkin
CRITERIO-ADM5.3: Vista de detalle con tabs
  Dado que:  el administrador está en el detalle de un evento
  Cuando:    ve la interfaz
  Entonces:  la información está organizada en tabs: Información (datos generales), Tiers (configuración), Reservas (lista activas), Métricas (ventas, ingresos, ocupación)
```

---

#### HU-SEC-08: Headers de seguridad HTTP y protección contra ataques comunes

```
Como:        Sistema
Quiero:      que todas las respuestas HTTP incluyan headers de seguridad estándar
Para:        proteger contra XSS, clickjacking, MIME sniffing y otros ataques comunes

Prioridad:   Alta
Estimación:  S (3 SP)
Dependencias: Ninguna
Capa:        Backend (api-gateway)
```

#### Criterios de Aceptación — HU-SEC-08

**Happy Path**
```gherkin
CRITERIO-SEC8.1: Headers de seguridad en todas las respuestas
  Dado que:  un cliente hace cualquier request al API Gateway
  Cuando:    recibe la respuesta
  Entonces:  incluye los headers:
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
    X-XSS-Protection: 0
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    Content-Security-Policy: default-src 'self'; script-src 'self'
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: camera=(), microphone=(), geolocation=()
```

```gherkin
CRITERIO-SEC8.2: Respuestas de error no revelan stack traces
  Dado que:  ocurre un error inesperado en un microservicio
  Cuando:    el cliente recibe la respuesta de error
  Entonces:  el body contiene un mensaje genérico "Error interno del servidor"
  Y no incluye stack trace, nombre de clases Java, ni rutas de archivos
```

---

#### HU-USR-01: Perfil básico del usuario

```
Como:        Usuario autenticado (ADMIN o BUYER)
Quiero:      acceder a una página de perfil mínima
Para:        actualizar mi contraseña y verificar el email de mi cuenta

Prioridad:   Baja
Estimación:  XS (2 SP)
Dependencias: HU-SEC-01 (SPEC-020)
Capa:        Ambas (api-gateway + frontend)
```

#### Criterios de Aceptación — HU-USR-01

**Happy Path**
```gherkin
CRITERIO-USR1.1: Vista de perfil con datos básicos
  Dado que:  el usuario está autenticado
  Cuando:    navega a "/perfil"
  Entonces:  ve su email (no editable), su rol (ADMIN o BUYER, no editable) y un formulario para cambiar contraseña
```

```gherkin
CRITERIO-USR1.2: Cambio de contraseña exitoso
  Dado que:  el usuario está en "/perfil"
  Cuando:    ingresa contraseña actual, nueva contraseña y confirmación
  Y la nueva contraseña cumple: mínimo 8 caracteres, una mayúscula, un número
  Entonces:  el sistema actualiza la contraseña con BCrypt
  Y muestra "Contraseña actualizada exitosamente"
  Y cierra la sesión para que vuelva a autenticarse
```

**Error Path**
```gherkin
CRITERIO-USR1.3: Contraseña actual incorrecta
  Dado que:  el usuario está en "/perfil"
  Cuando:    ingresa una contraseña actual incorrecta
  Entonces:  recibe 400 Bad Request con mensaje "La contraseña actual es incorrecta"
  Y no actualiza la contraseña
```

### Reglas de Negocio

1. **Tickets del usuario**: `GET /api/v1/tickets?buyerId={userId}` — solo el propio usuario o ADMIN puede consultar.
2. **Enriquecimiento cross-service**: ms-ticketing enriquece la respuesta con datos del evento (nombre, fecha) vía llamada interna a ms-events.
3. **PDF solo para VALID**: tickets con estado CANCELLED no pueden descargarse.
4. **PDF contiene**: título evento, fecha, sala, tier, precio, ticketId UUID, email comprador.
5. **Asociación de tickets anónimos**: al registrarse, `UPDATE tickets SET user_id = :userId WHERE buyer_email = :email AND user_id IS NULL`. Operación idempotente.
6. **Asociación vía RabbitMQ**: api-gateway publica `user.registered` con `{ userId, email }`, ms-ticketing consume y ejecuta la asociación.
7. **Métricas admin**: endpoint `GET /api/v1/events/admin/stats` retorna agregados. Datos por evento en el listado admin.
8. **Búsqueda**: `GET /api/v1/events/admin?search=<query>&page=0&size=10`.
9. **Salas CRUD**: `RoomController` ya tiene POST y GET. Agregar PUT y DELETE.
10. **Sala no eliminable si tiene eventos**: DELETE retorna 400 con listado de eventos asociados.
11. **Sidebar colapsable**: 80px colapsado, 264px expandido. CSS Modules.
12. **Tabs en detalle**: Información, Tiers, Reservas, Métricas.
13. **Headers de seguridad**: `SecurityHeadersFilter` global en api-gateway o configuración de Spring Security headers.
14. **Errores 500 genéricos**: `GlobalExceptionHandler` en cada microservicio retorna `"Error interno del servidor"` sin stack traces.
15. **Cambio de contraseña**: validar contraseña actual con BCrypt. Invalidar sesión tras cambio.
16. **Contraseña nueva**: mínimo 8 caracteres, 1 mayúscula, 1 número.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Ticket` | tabla `tickets` (BD ms-ticketing) | agregar/verificar `buyer_email`, `user_id` | Para asociación de tickets anónimos |
| `Room` | tabla `rooms` (BD ms-events) | Sin cambios de esquema | CRUD completo (PUT/DELETE nuevos) |
| `User` | tabla `users` (BD api-gateway) | Sin cambios de esquema | Endpoint cambio de contraseña |

#### Campos a verificar/agregar — `Ticket`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `buyer_email` | VARCHAR(255) | no | formato email | Email del comprador (anónimo o registrado). Si no existe, agregar con Flyway migration |
| `user_id` | UUID | no | FK o referencia lógica | userId del comprador autenticado. NULL para compras anónimas |

#### Índices / Constraints
- `INDEX idx_tickets_buyer_email ON tickets(buyer_email)` — búsqueda en asociación de tickets anónimos
- `INDEX idx_tickets_user_id ON tickets(user_id)` — filtrado de tickets por usuario

### API Endpoints

#### GET /api/v1/tickets?buyerId={userId}
- **Descripción**: Lista tickets de un comprador autenticado
- **Auth requerida**: sí (BUYER propietario o ADMIN)
- **Microservicio**: ms-ticketing
- **Query params**: `buyerId` (UUID), `page` (int, default 0), `size` (int, default 10)
- **Response 200**:
  ```json
  {
    "content": [
      {
        "ticketId": "uuid",
        "eventId": "uuid",
        "eventTitle": "Nombre del Evento",
        "eventDate": "2026-06-15T20:00:00Z",
        "tier": "VIP",
        "pricePaid": 150000,
        "status": "VALID",
        "purchasedAt": "2026-03-31T10:00:00Z",
        "buyerEmail": "juan@email.com"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 25,
    "totalPages": 3
  }
  ```
- **Response 401**: token ausente
- **Response 403**: buyerId no coincide con userId del token (y no es ADMIN)

#### GET /api/v1/tickets/{ticketId}/pdf
- **Descripción**: Genera y descarga PDF de un ticket
- **Auth requerida**: sí (propietario o ADMIN)
- **Microservicio**: ms-ticketing
- **Response 200**: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="ticket-{ticketId}.pdf"`
- **Response 400**: ticket en estado CANCELLED
- **Response 401**: token ausente
- **Response 403**: no es propietario ni ADMIN
- **Response 404**: ticket no encontrado

#### GET /api/v1/events/admin/stats
- **Descripción**: Métricas agregadas para el dashboard admin
- **Auth requerida**: sí (ADMIN)
- **Microservicio**: ms-events (coordina con ms-ticketing)
- **Response 200**:
  ```json
  {
    "totalEvents": 42,
    "publishedEvents": 15,
    "totalTicketsSold": 1250,
    "activeReservations": 34
  }
  ```
- **Response 401**: token ausente
- **Response 403**: rol insuficiente

#### GET /api/v1/events/admin?search={query}&page={page}&size={size}
- **Descripción**: Listado admin con búsqueda y paginación, incluye métricas por evento
- **Auth requerida**: sí (ADMIN)
- **Microservicio**: ms-events
- **Query params**: `search` (string, opcional), `page` (int, default 0), `size` (int, default 10)
- **Response 200**:
  ```json
  {
    "content": [
      {
        "id": "uuid",
        "title": "Nombre Evento",
        "status": "PUBLISHED",
        "date": "2026-06-15T20:00:00Z",
        "capacity": 500,
        "ticketsSold": 320,
        "activeReservations": 12,
        "estimatedRevenue": 48000000,
        "roomName": "Sala Principal"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 42,
    "totalPages": 5
  }
  ```

#### PUT /api/v1/rooms/{id}
- **Descripción**: Actualiza una sala existente
- **Auth requerida**: sí (ADMIN)
- **Microservicio**: ms-events
- **Request Body**:
  ```json
  {
    "name": "Sala Principal Renovada",
    "maxCapacity": 600
  }
  ```
- **Response 200**: sala actualizada
- **Response 400**: validación fallida
- **Response 401**: token ausente
- **Response 403**: rol insuficiente
- **Response 404**: sala no encontrada

#### DELETE /api/v1/rooms/{id}
- **Descripción**: Elimina una sala (solo si no tiene eventos asociados)
- **Auth requerida**: sí (ADMIN)
- **Microservicio**: ms-events
- **Response 204**: eliminada exitosamente
- **Response 400**: `{ "error": "No se puede eliminar la sala. Tiene eventos asociados", "events": ["Evento 1", "Evento 2"] }`
- **Response 401**: token ausente
- **Response 403**: rol insuficiente
- **Response 404**: sala no encontrada

#### PATCH /api/v1/auth/me/password
- **Descripción**: Cambio de contraseña del usuario autenticado
- **Auth requerida**: sí (ADMIN o BUYER)
- **Microservicio**: api-gateway
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword456"
  }
  ```
- **Response 200**: `{ "message": "Contraseña actualizada exitosamente" }`
- **Response 400**: contraseña actual incorrecta o nueva contraseña no cumple requisitos
- **Response 401**: token ausente

#### RabbitMQ Event: `user.registered`
- **Publicado por**: api-gateway (post-registro de comprador)
- **Consumido por**: ms-ticketing
- **Payload**:
  ```json
  {
    "userId": "uuid",
    "email": "juan@email.com",
    "role": "BUYER",
    "registeredAt": "2026-03-31T10:00:00Z"
  }
  ```
- **Acción en ms-ticketing**: `UPDATE tickets SET user_id = :userId WHERE buyer_email = :email AND user_id IS NULL`

### Diseño Frontend

#### Componentes nuevos
| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `StatsCards` | `components/StatsCards.tsx` | `stats: {totalEvents, publishedEvents, ticketsSold, activeReservations}` | Tarjetas de métricas en dashboard |
| `AdminSidebar` | `components/AdminSidebar.tsx` | `currentPath` | Sidebar de navegación admin |
| `AdminLayout` | `components/AdminLayout.tsx` | `children` | Layout con sidebar + topbar |
| `RoomFormModal` | `components/RoomFormModal.tsx` | `room?, isOpen, onClose, onSubmit` | Modal de creación/edición de sala |
| `EventDetailTabs` | `components/EventDetailTabs.tsx` | `event, activeTab` | Sistema de tabs para detalle |
| `TicketCard` | `components/TicketCard.tsx` | `ticket, onDownload` | Tarjeta de ticket en "/mis-tickets" |
| `ProfilePage` | `pages/ProfilePage.tsx` | — | Página de perfil con cambio de contraseña |
| `RoomsPage` | `pages/RoomsPage.tsx` | — | Página admin CRUD de salas |

#### Componentes modificados
| Componente | Archivo | Cambios |
|------------|---------|---------|
| `EventsDashboard` | `pages/EventsDashboard.tsx` | Agregar StatsCards, búsqueda con debounce, paginación, columnas de métricas |
| `EventDetailAdmin` | `pages/EventDetailAdmin.tsx` | Reemplazar layout por EventDetailTabs |
| `AdminNavBar` | `components/AdminNavBar.tsx` | Reemplazar por AdminLayout (sidebar + topbar) |
| `MyTicketsPage` | `pages/MyTicketsPage.tsx` | Usar datos reales de API (no localStorage/mock) |

#### Páginas nuevas
| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `RoomsPage` | `pages/RoomsPage.tsx` | `/admin/rooms` | sí (ADMIN) |
| `ProfilePage` | `pages/ProfilePage.tsx` | `/perfil` | sí (ADMIN o BUYER) |

#### Hooks y State
| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useMyTickets` | `hooks/useMyTickets.ts` | `{ tickets, loading, error, page, setPage }` | Tickets reales del usuario autenticado |
| `useAdminStats` | `hooks/useAdminStats.ts` | `{ stats, loading, error }` | Métricas agregadas del dashboard |
| `useRooms` | `hooks/useRooms.ts` | `{ rooms, loading, create, update, remove }` | CRUD de salas |

#### Services (llamadas API)
| Función | Archivo | Endpoint |
|---------|---------|---------|
| `getMyTickets(page, size)` | `services/ticketService.ts` | `GET /api/v1/tickets?buyerId={userId}` |
| `downloadTicketPdf(ticketId)` | `services/ticketService.ts` | `GET /api/v1/tickets/{ticketId}/pdf` |
| `getAdminStats()` | `services/adminEventService.ts` | `GET /api/v1/events/admin/stats` |
| `getAdminEvents(search, page, size)` | `services/adminEventService.ts` | `GET /api/v1/events/admin?search=&page=&size=` |
| `updateRoom(id, data)` | `services/roomService.ts` | `PUT /api/v1/rooms/{id}` |
| `deleteRoom(id)` | `services/roomService.ts` | `DELETE /api/v1/rooms/{id}` |
| `changePassword(current, newPass)` | `services/authService.ts` | `PATCH /api/v1/auth/me/password` |

### Arquitectura y Dependencias

#### ms-ticketing — nuevas dependencias
- `com.itextpdf:itext-core:8.0.x` o `org.apache.pdfbox:pdfbox:3.0.x` (para generación de PDF)

#### Componentes nuevos
| Microservicio | Componente | Responsabilidad |
|---------------|------------|-----------------|
| ms-ticketing | `PdfService` | Generar PDF de ticket |
| ms-ticketing | `TicketAssociationListener` | Listener de `user.registered` para asociar tickets anónimos |
| ms-events | `EventStatsService` | Calcular métricas agregadas (coordina con ms-ticketing) |
| api-gateway | `SecurityHeadersFilter` | Inyectar headers de seguridad en todas las respuestas |

#### Comunicación cross-service
- ms-ticketing → ms-events: llamada HTTP interna para obtener datos del evento (nombre, fecha, sala) al enriquecer tickets y generar PDF.
- ms-events → ms-ticketing: llamada HTTP interna para obtener conteo de tickets vendidos y reservas activas por evento (para métricas).
- api-gateway → ms-ticketing: evento RabbitMQ `user.registered` para asociación de tickets anónimos.

### Notas de Implementación

1. **PDF con iText**: usar `PdfDocument` + `Document` para layout simple. Incluir logo SEM7 si hay asset disponible.
2. **Enriquecimiento de tickets**: ms-ticketing llama a ms-events via HTTP (usando `WebClient` o `RestTemplate`) para obtener datos del evento. Cache opcional con `@Cacheable` para evitar llamadas repetidas.
3. **Métricas cross-service**: ms-events expone endpoint admin que internamente llama a ms-ticketing para obtener conteos. Alternativa: ms-ticketing alimenta contadores via RabbitMQ.
4. **Búsqueda por título**: `LIKE '%query%'` en SQL o `JpaSpecificationExecutor` con filtro dinámico.
5. **Paginación**: usar `Pageable` de Spring Data JPA. Response mapeado a estructura `{ content, page, size, totalElements, totalPages }`.
6. **RoomController existente**: ya tiene `POST /api/v1/rooms` y `GET /api/v1/rooms`. Solo agregar `PUT /{id}` y `DELETE /{id}`.
7. **Sidebar CSS Modules**: `AdminSidebar.module.css` con variables para ancho colapsado/expandido. Transición CSS para el collapse.
8. **Tabs**: componente controlado con estado local `activeTab`. Cada tab carga datos bajo demanda.
9. **Headers de seguridad**: si se configura via Spring Security (`SecurityFilterChain`), usar `.headers()` builder. Si no, crear `WebFilter` manual.
10. **Global error handling**: revisar `GlobalExceptionHandler` en los 3 microservicios. Eliminar stack traces en responses. Solo incluir `message`, `status`, `timestamp`.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend

#### HU-TKT-01 — Vista real de tickets
- [ ] Verificar/implementar `GET /api/v1/tickets?buyerId={userId}` en ms-ticketing con paginación
- [ ] Proteger endpoint — solo el propio usuario o ADMIN puede consultar (validar `X-User-Id` header)
- [ ] Enriquecer response con datos del evento (título, fecha) vía llamada a ms-events
- [ ] Agregar índice `idx_tickets_user_id` si no existe

#### HU-TKT-03 — Descarga de ticket en PDF
- [ ] Agregar dependencia `itext-core` o `pdfbox` en `ms-ticketing/build.gradle`
- [ ] Implementar `PdfService` para generar PDF con datos del ticket + evento
- [ ] Implementar `GET /api/v1/tickets/{ticketId}/pdf` en ms-ticketing
- [ ] Retornar con headers `Content-Type: application/pdf` y `Content-Disposition: attachment`
- [ ] Proteger endpoint — solo propietario o ADMIN
- [ ] Validar que ticket esté en estado VALID antes de generar

#### HU-TKT-02 — Asociación de tickets anónimos
- [ ] Verificar que `buyer_email` se guarda en tabla `tickets` (agregar con migration Flyway si no existe)
- [ ] Verificar/agregar campo `user_id` (UUID nullable) en tabla `tickets`
- [ ] Implementar método `TicketService.associateAnonymousTickets(userId, email)`: `UPDATE tickets SET user_id = :userId WHERE buyer_email = :email AND user_id IS NULL`
- [ ] Implementar listener RabbitMQ de `user.registered` en ms-ticketing (`TicketAssociationListener`)
- [ ] Publicar evento `user.registered` desde api-gateway tras registro de comprador

#### HU-ADM-03 — Dashboard con métricas
- [ ] Implementar `GET /api/v1/events/admin/stats` en ms-events con métricas agregadas
- [ ] Implementar `GET /api/v1/events/admin?search={query}&page={page}&size={size}` con búsqueda y paginación
- [ ] Agregar métricas por evento al response admin: ticketsSold, activeReservations, estimatedRevenue
- [ ] Coordinar con ms-ticketing para obtener conteos de tickets/reservas por evento

#### HU-ADM-04 — Gestión de salas (CRUD completo)
- [ ] Implementar `PUT /api/v1/rooms/{id}` en `RoomController` — actualización de sala
- [ ] Implementar `DELETE /api/v1/rooms/{id}` en `RoomController` — eliminación con validación de eventos asociados
- [ ] Validar que sala con eventos DRAFT o PUBLISHED no se puede eliminar
- [ ] Proteger todos los endpoints de salas con role ADMIN

#### HU-SEC-08 — Headers de seguridad HTTP
- [ ] Implementar `SecurityHeadersFilter` global en api-gateway con todos los headers de seguridad
- [ ] Revisar y sanitizar `GlobalExceptionHandler` en ms-events, ms-ticketing, ms-notifications
- [ ] Asegurar que errores 500 retornan mensaje genérico sin stack traces ni rutas de archivos

#### HU-USR-01 — Perfil básico (backend)
- [ ] Verificar que `GET /api/v1/auth/me` retorna email y role del usuario autenticado
- [ ] Implementar `PATCH /api/v1/auth/me/password` — validar contraseña actual con BCrypt, actualizar con nueva
- [ ] Validar requisitos de complejidad de la nueva contraseña (min 8, 1 mayúscula, 1 número)
- [ ] Invalidar token actual tras cambio de contraseña (o cerrar sesión del lado del cliente)

#### Tests Backend
- [ ] Test: GET /api/v1/tickets?buyerId retorna tickets reales paginados
- [ ] Test: usuario no puede ver tickets de otro usuario (403)
- [ ] Test: GET /api/v1/tickets/{id}/pdf genera PDF correctamente
- [ ] Test: ticket CANCELLED no genera PDF (400)
- [ ] Test: asociación de tickets anónimos al registrarse funciona correctamente
- [ ] Test: asociación no duplica tickets ya asociados
- [ ] Test: GET /api/v1/events/admin/stats retorna métricas correctas
- [ ] Test: búsqueda por título filtra correctamente
- [ ] Test: paginación retorna la página solicitada
- [ ] Test: PUT /api/v1/rooms/{id} actualiza sala
- [ ] Test: DELETE /api/v1/rooms/{id} rechaza cuando hay eventos asociados
- [ ] Test: DELETE /api/v1/rooms/{id} elimina cuando no hay eventos
- [ ] Test: headers de seguridad presentes en todas las respuestas
- [ ] Test: errores 500 no revelan stack traces
- [ ] Test: PATCH /api/v1/auth/me/password actualiza contraseña correctamente
- [ ] Test: PATCH /api/v1/auth/me/password rechaza contraseña actual incorrecta

### Frontend

#### HU-TKT-01 — Vista real de tickets
- [ ] Crear hook `useMyTickets` que consuma `GET /api/v1/tickets?buyerId={userId}` real
- [ ] Reemplazar lógica de localStorage/mock en la vista de tickets por llamada real a la API
- [ ] Crear componente `TicketCard` para mostrar cada ticket
- [ ] Mostrar estado vacío "Aún no tienes tickets" con botón "Ver cartelera"

#### HU-TKT-03 — Descarga de ticket en PDF
- [ ] Agregar ícono/botón de descarga en cada `TicketCard` en "/mis-tickets"
- [ ] Implementar descarga de blob PDF con `downloadTicketPdf(ticketId)` en `ticketService.ts`
- [ ] Deshabilitar botón de descarga para tickets CANCELLED
- [ ] Manejar blob response para forzar descarga en el navegador

#### HU-ADM-03 — Dashboard con métricas (frontend)
- [ ] Crear componente `StatsCards` con las 4 tarjetas de resumen
- [ ] Crear hook `useAdminStats` que consuma `GET /api/v1/events/admin/stats`
- [ ] Agregar columnas de métricas a la tabla de eventos (ticketsSold/capacity con barra de progreso, reservas, ingresos)
- [ ] Implementar barra de búsqueda con debounce (300ms)
- [ ] Implementar paginación con controles prev/next y selector de página

#### HU-ADM-04 — Gestión de salas (frontend)
- [ ] Crear página `/admin/rooms` (`RoomsPage`) con tabla de salas
- [ ] Crear `RoomFormModal` para creación/edición de salas
- [ ] Crear hook `useRooms` con CRUD completo
- [ ] Agregar funciones `updateRoom(id, data)` y `deleteRoom(id)` en `roomService.ts`
- [ ] Agregar link "Salas" en la navegación del admin
- [ ] Implementar acción de eliminar con confirmación

#### HU-ADM-05 — Navegación mejorada (frontend)
- [ ] Crear componente `AdminSidebar` con navegación por secciones (Dashboard, Eventos, Salas)
- [ ] Crear `AdminLayout` (sidebar + topbar) y usarlo en todas las rutas admin
- [ ] Hacer sidebar responsive (colapsable en mobile) con CSS Modules
- [ ] Crear `EventDetailTabs` con tabs: Información, Tiers, Reservas, Métricas
- [ ] Reemplazar `AdminNavBar` fijo por layout sidebar + topbar
- [ ] Mejorar topbar con avatar, nombre y menú desplegable de usuario

#### HU-USR-01 — Perfil básico (frontend)
- [ ] Crear página `/perfil` (`ProfilePage`) con email (solo lectura), rol (solo lectura) y formulario de cambio de contraseña
- [ ] Agregar función `changePassword(current, newPass)` en `authService.ts`
- [ ] Agregar link "Mi Perfil" en menú desplegable del usuario (navbar comprador y sidebar admin)
- [ ] Al cambiar contraseña exitosamente, cerrar sesión y redirigir a login

#### Tests Frontend
- [ ] Test: MyTicketsPage muestra tickets reales de la API
- [ ] Test: estado vacío se muestra cuando no hay tickets
- [ ] Test: botón de descarga PDF funciona para tickets VALID
- [ ] Test: botón de descarga deshabilitado para tickets CANCELLED
- [ ] Test: StatsCards renderiza las 4 métricas correctamente
- [ ] Test: búsqueda filtra eventos por título con debounce
- [ ] Test: paginación navega entre páginas
- [ ] Test: RoomsPage muestra tabla de salas
- [ ] Test: RoomFormModal envía datos correctos al crear/editar
- [ ] Test: eliminación de sala muestra confirmación
- [ ] Test: AdminSidebar resalta sección activa
- [ ] Test: EventDetailTabs cambia entre tabs
- [ ] Test: ProfilePage muestra email y rol no editables
- [ ] Test: cambio de contraseña cierra sesión exitosamente

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios TKT1.1–TKT1.3, TKT2.1–TKT2.3, TKT3.1–TKT3.3, ADM3.1–ADM3.3, ADM4.1–ADM4.4, ADM5.1–ADM5.3, SEC8.1–SEC8.2, USR1.1–USR1.3
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar comunicación cross-service (ms-ticketing ↔ ms-events, api-gateway → ms-ticketing vía RabbitMQ)
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
