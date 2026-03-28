---
id: SPEC-015
status: DRAFT
feature: admin-event-management
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: [SPEC-011, SPEC-014]
---

# Spec: Dashboard de Eventos y Creación de Eventos — Panel de Administración

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Panel de administración para gestionar el catálogo de eventos. Incluye un dashboard con tabla de todos los eventos (DRAFT, PUBLISHED, CANCELLED) con filtros y acciones contextuales, y un formulario de creación de eventos con metadata artística, selector de sala y validaciones en tiempo real. Requiere dos endpoints backend nuevos: listado de salas (`GET /api/v1/rooms`) y listado admin de todos los eventos (`GET /api/v1/events/admin`).

### Requerimiento de Negocio
Tomado de `.github/requirements/integracion-admin-frontend.md`, historias HU-ADM-02 y HU-ADM-03 de la Parte B — Panel de Administración Frontend.

### Historias de Usuario

#### HU-ADM-02: Dashboard de eventos — Listado y gestión

```
Como:        Administrador
Quiero:      ver un listado de todos los eventos del sistema con su estado actual
Para:        gestionar el catálogo, identificar borradores pendientes de publicar y monitorear eventos activos

Prioridad:   Alta
Estimación:  3 SP
Dependencias: SPEC-014 (auth + AdminLayout), SPEC-011 (metadata backend)
Capa:        Ambas (frontend principal + 1 endpoint backend)
```

#### Criterios de Aceptación — HU-ADM-02

**Happy Path**
```gherkin
CRITERIO-2.1: Tabla de eventos con columnas principales
  Dado que:  el administrador está autenticado y accede a /admin/events
  Cuando:    la vista carga
  Entonces:  se muestra una tabla con columnas: Título, Fecha, Sala, Estado, Aforo, Tiers, Acciones
  Y          cada fila muestra un evento del sistema (todos los estados: DRAFT, PUBLISHED, CANCELLED)
  Y          el estado se muestra como badge visual (DRAFT=amarillo, PUBLISHED=verde, CANCELLED=rojo)
```

```gherkin
CRITERIO-2.2: Filtro por estado del evento
  Dado que:  el administrador está en el dashboard con eventos de múltiples estados
  Cuando:    selecciona un filtro de estado (Todos, Borrador, Publicado, Cancelado)
  Entonces:  la tabla muestra solo los eventos que coinciden con el estado seleccionado
  Y          el filtro es client-side (sin llamada adicional al backend)
```

```gherkin
CRITERIO-2.3: Indicador de tiers configurados
  Dado que:  un evento tiene tiers configurados
  Cuando:    se renderiza la fila del evento
  Entonces:  la columna Tiers muestra el número de tiers (ej. "3 tiers")
  Y          si no tiene tiers muestra "Sin tiers" en color de advertencia
```

```gherkin
CRITERIO-2.4: Publicar evento DRAFT con tiers desde la tabla
  Dado que:  un evento está en estado DRAFT y tiene al menos un tier configurado
  Cuando:    el administrador hace clic en "Publicar" en la fila del evento
  Entonces:  el sistema llama a PATCH /api/v1/events/:id/publish con header X-Role: ADMIN
  Y          el estado del evento cambia a PUBLISHED
  Y          el badge se actualiza en la tabla sin recargar la página
```

**Error Path**
```gherkin
CRITERIO-2.5: Publicar bloqueado sin tiers
  Dado que:  un evento está en estado DRAFT sin tiers configurados
  Cuando:    se renderiza la fila del evento
  Entonces:  el botón "Publicar" está deshabilitado
  Y          se muestra un tooltip: "Configura al menos un tier antes de publicar"
```

```gherkin
CRITERIO-2.6: Error al cargar eventos del backend
  Dado que:  el endpoint GET /api/v1/events/admin falla (500 o network error)
  Cuando:    la vista intenta cargar los eventos
  Entonces:  se muestra un mensaje de error con opción de reintentar
```

**Edge Case**
```gherkin
CRITERIO-2.7: Dashboard sin eventos (estado vacío)
  Dado que:  no existen eventos en el sistema
  Cuando:    el administrador accede al dashboard
  Entonces:  se muestra un estado vacío con ilustración + "No hay eventos aún"
  Y          un botón "Crear Primer Evento" que navega a /admin/events/new
```

```gherkin
CRITERIO-2.8: Navegación desde el dashboard
  Dado que:  el administrador está en /admin/events
  Cuando:    hace clic en el título de un evento
  Entonces:  navega a /admin/events/:id
  Cuando:    hace clic en "Crear Evento"
  Entonces:  navega a /admin/events/new
```

---

#### HU-ADM-03: Crear evento con metadata artística

```
Como:        Administrador
Quiero:      crear un nuevo evento ingresando la información base, el aforo y metadata artística
Para:        prepararlo para su configuración comercial y posterior publicación con información visual completa

Prioridad:   Alta
Estimación:  5 SP
Dependencias: SPEC-014 (auth), HU-ADM-02 (listado), SPEC-011 (metadata backend)
Capa:        Ambas (frontend principal + 1 endpoint backend)
```

#### Criterios de Aceptación — HU-ADM-03

**Happy Path**
```gherkin
CRITERIO-3.1: Formulario con campos obligatorios y opcionales
  Dado que:  el administrador está en /admin/events/new
  Cuando:    la vista carga
  Entonces:  se muestra un formulario con:
             - Obligatorios (*): Título, Descripción, Fecha/Hora, Aforo, Sala (selector)
             - Opcionales: Subtítulo, URL de Imagen, Director, Elenco, Duración (min),
               Ubicación, Etiqueta (tag), Aforo Limitado (toggle), Evento Destacado (toggle), Autor
  Y          los campos obligatorios están marcados con asterisco (*)
```

```gherkin
CRITERIO-3.2: Selector de sala con referencia de aforo
  Dado que:  el administrador selecciona una sala del dropdown
  Cuando:    la sala se selecciona
  Entonces:  se muestra el aforo máximo de la sala como referencia (ej. "Máximo: 300")
  Y          el dropdown se pobla desde GET /api/v1/rooms
```

```gherkin
CRITERIO-3.3: Creación exitosa y redirección
  Dado que:  el administrador completó todos los campos obligatorios con datos válidos
  Cuando:    hace clic en "Crear Evento"
  Entonces:  se llama a POST /api/v1/events con los datos del formulario y headers X-Role + X-User-Id
  Y          si la respuesta es 201, se muestra un toast de éxito
  Y          se redirige a /admin/events/:id (detalle del evento recién creado)
```

```gherkin
CRITERIO-3.4: Preview de imagen por URL
  Dado que:  el administrador ingresa una URL en el campo Imagen
  Cuando:    el campo pierde foco (onBlur)
  Entonces:  se muestra una miniatura de preview de la imagen
  Y          si la URL no carga, se muestra un placeholder de imagen rota
```

**Error Path**
```gherkin
CRITERIO-3.5: Validación de aforo vs sala
  Dado que:  el administrador seleccionó una sala con maxCapacity=300
  Cuando:    ingresa un aforo mayor a 300
  Entonces:  el campo muestra error inline: "El aforo no puede exceder la capacidad de la sala (300)"
  Y          el botón "Crear Evento" se deshabilita
```

```gherkin
CRITERIO-3.6: Validación de fecha futura
  Dado que:  el administrador ingresa una fecha para el evento
  Cuando:    la fecha es anterior o igual al momento actual
  Entonces:  el campo muestra error inline: "La fecha debe ser posterior a la fecha actual"
  Y          el botón "Crear Evento" se deshabilita
```

```gherkin
CRITERIO-3.7: Manejo de errores del backend
  Dado que:  el administrador envía datos que causan un error
  Cuando:    la respuesta es 409 (evento duplicado)
  Entonces:  se muestra: "Ya existe un evento con ese título y fecha"
  Cuando:    la respuesta es 404 (sala no encontrada)
  Entonces:  se muestra: "La sala seleccionada no existe"
  Cuando:    la respuesta es 400 (validación)
  Entonces:  se muestra el mensaje de error del backend
```

**Edge Case**
```gherkin
CRITERIO-3.8: Validación de duración
  Dado que:  el administrador ingresa una duración
  Cuando:    el valor es menor o igual a cero
  Entonces:  se muestra error inline: "La duración debe ser mayor a 0 minutos"
```

```gherkin
CRITERIO-3.9: Campos obligatorios vacíos
  Dado que:  el administrador intenta enviar el formulario
  Cuando:    uno o más campos obligatorios están vacíos
  Entonces:  cada campo vacío muestra error inline: "Este campo es obligatorio"
  Y          el formulario no se envía
```

### Reglas de Negocio
1. Solo usuarios con `X-Role: ADMIN` pueden acceder a `GET /api/v1/events/admin` y `GET /api/v1/rooms`.
2. El aforo del evento no puede exceder `room.maxCapacity`.
3. La fecha del evento debe ser futura (posterior a `NOW()` UTC).
4. No pueden existir dos eventos con el mismo título y la misma fecha (unicidad validada por backend).
5. Un evento solo puede publicarse si está en estado DRAFT y tiene al menos un tier configurado.
6. Los campos de metadata artística (subtitle, imageUrl, location, director, cast, duration, tag, isLimited, isFeatured, author) son opcionales. Los booleanos defaultean a `false`.
7. El endpoint `GET /api/v1/events/admin` devuelve TODOS los eventos sin filtrar por estado — el filtro es client-side.
8. Todas las peticiones admin incluyen headers `X-Role: ADMIN` y `X-User-Id: <uuid>` obtenidos de `useAuth()`.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Event` | tabla `event` | sin cambios | Ya existe con campos de metadata (tras SPEC-011) |
| `Room` | tabla `room` | sin cambios | Ya existe — solo se expone nuevo endpoint de listado |

> **Nota:** No se requieren cambios en las entidades JPA ni migraciones Flyway. Los modelos ya tienen los campos necesarios tras SPEC-011. Solo se agregan nuevos endpoints de lectura.

### API Endpoints

#### GET /api/v1/events/admin — Listar todos los eventos (admin)
- **Descripción**: Devuelve todos los eventos del sistema sin filtrar por estado. Incluye DRAFT, PUBLISHED y CANCELLED con información de room y tiers.
- **Auth requerida**: `X-Role: ADMIN`
- **Request Headers**:
  ```
  X-Role: ADMIN (obligatorio)
  X-User-Id: <uuid> (obligatorio)
  ```
- **Response 200**:
  ```json
  {
    "total": 5,
    "events": [
      {
        "id": "uuid",
        "title": "BODAS DE SANGRE",
        "description": "Una tragedia...",
        "date": "2026-05-01T20:00:00",
        "capacity": 200,
        "status": "PUBLISHED",
        "room": {
          "id": "uuid",
          "name": "Teatro Real",
          "maxCapacity": 300,
          "created_at": "iso8601",
          "updated_at": "iso8601"
        },
        "availableTiers": [
          {
            "id": "uuid",
            "tierType": "GENERAL",
            "price": 75.00,
            "quota": 150,
            "validFrom": null,
            "validUntil": null,
            "isAvailable": true,
            "reason": null
          }
        ],
        "imageUrl": "https://picsum.photos/seed/theater/1200/800",
        "subtitle": "Federico García Lorca",
        "location": "TEATRO REAL, MADRID",
        "director": "Alejandro G. Iñárritu",
        "castMembers": "Penélope Cruz, Javier Bardem",
        "duration": 120,
        "tag": "FEATURED PERFORMANCE",
        "isLimited": false,
        "isFeatured": true,
        "author": null,
        "created_at": "iso8601"
      }
    ]
  }
  ```
- **Response 403**: `X-Role` no es ADMIN
  ```json
  { "error": "Only users with X-Role: ADMIN can access admin endpoints" }
  ```

#### GET /api/v1/rooms — Listar todas las salas
- **Descripción**: Devuelve todas las salas registradas. Usado por el selector de sala del formulario de creación de eventos.
- **Auth requerida**: `X-Role: ADMIN`
- **Request Headers**:
  ```
  X-Role: ADMIN (obligatorio)
  ```
- **Response 200**:
  ```json
  [
    {
      "id": "uuid",
      "name": "Teatro Real",
      "maxCapacity": 300,
      "created_at": "iso8601",
      "updated_at": "iso8601"
    },
    {
      "id": "uuid",
      "name": "Grand Opera House",
      "maxCapacity": 500,
      "created_at": "iso8601",
      "updated_at": "iso8601"
    }
  ]
  ```
- **Response 403**: `X-Role` no es ADMIN
  ```json
  { "error": "Only users with X-Role: ADMIN can list rooms" }
  ```

#### Endpoints existentes utilizados (sin cambios)
| Método | Ruta | Uso |
|--------|------|-----|
| `POST /api/v1/events` | Crear evento — `EventCreateRequest` (tras SPEC-011 acepta metadata) |
| `PATCH /api/v1/events/:id/publish` | Publicar evento — requiere `X-Role: ADMIN` |

### Backend — Cambios por capa

#### Controller (`EventController.java`)
Agregar método `getAllEventsAdmin`:
```java
@GetMapping("/admin")
public ResponseEntity<Map<String, Object>> getAllEventsAdmin(
    @RequestHeader("X-Role") String role,
    @RequestHeader("X-User-Id") String userId
) {
    // Valida role ADMIN, devuelve todos los eventos con room + tiers
}
```

#### Controller (`RoomController.java`)
Agregar método `getAllRooms`:
```java
@GetMapping
public ResponseEntity<List<RoomResponse>> getAllRooms(
    @RequestHeader(value = "X-Role", required = false) String role
) {
    // Valida role ADMIN, devuelve todas las salas
}
```

#### Service (`EventService.java`)
Agregar método `getAllEvents`:
```java
@Transactional(readOnly = true)
public List<EventDetailResponse> getAllEvents() {
    List<Event> allEvents = eventRepository.findAll();
    return allEvents.stream()
        .map(this::convertToAdminEventDetailResponse)
        .toList();
}
```

> **Nota**: El response para admin debe incluir `status` (que `EventDetailResponse` actual NO incluye). Se necesita un nuevo DTO `AdminEventDetailResponse` o extender `EventDetailResponse` para incluir `status`.

#### DTO nuevo: `AdminEventDetailResponse`
```java
public record AdminEventDetailResponse(
    UUID id,
    String title,
    String description,
    LocalDateTime date,
    Integer capacity,
    EventStatus status,
    RoomResponse room,
    List<AvailableTierResponse> availableTiers,
    String imageUrl,
    String subtitle,
    String location,
    String director,
    String castMembers,
    Integer duration,
    String tag,
    Boolean isLimited,
    Boolean isFeatured,
    String author,
    String createdBy,
    LocalDateTime created_at,
    LocalDateTime updated_at
) {}
```

#### Service (`RoomService.java`)
Agregar método `getAllRooms`:
```java
@Transactional(readOnly = true)
public List<RoomResponse> getAllRooms() {
    return roomRepository.findAll().stream()
        .map(this::mapToResponse)
        .toList();
}
```

### Diseño Frontend

#### Componentes nuevos
| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| `EventsDashboard` | `pages/admin/EventsDashboard/EventsDashboard.tsx` | ninguna (page) | Tabla de todos los eventos con filtros y acciones |
| `EventsDashboard.module.css` | `pages/admin/EventsDashboard/EventsDashboard.module.css` | — | Estilos del dashboard |
| `CreateEventPage` | `pages/admin/CreateEventPage/CreateEventPage.tsx` | ninguna (page) | Formulario de creación de evento |
| `CreateEventPage.module.css` | `pages/admin/CreateEventPage/CreateEventPage.module.css` | — | Estilos del formulario |
| `EventStatusBadge` | `components/admin/EventStatusBadge/EventStatusBadge.tsx` | `status: EventStatus` | Badge visual por estado |
| `EventForm` | `components/admin/EventForm/EventForm.tsx` | `EventFormProps` | Formulario reutilizable (crear/editar) |
| `ImagePreview` | `components/admin/ImagePreview/ImagePreview.tsx` | `url: string` | Preview de imagen por URL |

#### Props Interfaces

```typescript
// types/admin.types.ts

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export type StatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface AdminEventResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  status: EventStatus;
  room: RoomResponse;
  availableTiers: TierResponse[];
  imageUrl?: string;
  subtitle?: string;
  location?: string;
  director?: string;
  castMembers?: string;
  duration?: number;
  tag?: string;
  isLimited?: boolean;
  isFeatured?: boolean;
  author?: string;
  createdBy: string;
  created_at: string;
  updated_at: string;
}

export interface AdminEventsListResponse {
  total: number;
  events: AdminEventResponse[];
}

export interface RoomOption {
  id: string;
  name: string;
  maxCapacity: number;
}

export interface EventCreateFormData {
  title: string;
  description: string;
  date: string;          // ISO datetime-local
  capacity: number;
  roomId: string;        // UUID
  subtitle?: string;
  imageUrl?: string;
  director?: string;
  castMembers?: string;
  duration?: number;
  location?: string;
  tag?: string;
  isLimited: boolean;
  isFeatured: boolean;
  author?: string;
}

export interface EventStatusBadgeProps {
  status: EventStatus;
}

export interface EventFormProps {
  rooms: RoomOption[];
  onSubmit: (data: EventCreateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError?: string;
}

export interface ImagePreviewProps {
  url: string;
}
```

#### Páginas nuevas
| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `EventsDashboard` | `pages/admin/EventsDashboard/EventsDashboard.tsx` | `/admin/events` | sí (AdminGuard de SPEC-014) |
| `CreateEventPage` | `pages/admin/CreateEventPage/CreateEventPage.tsx` | `/admin/events/new` | sí (AdminGuard de SPEC-014) |

#### Hooks y State
| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useAdminEvents` | `hooks/useAdminEvents.ts` | `{ events, loading, error, refresh, publishEvent }` | Carga todos los eventos vía admin endpoint |
| `useRooms` | `hooks/useRooms.ts` | `{ rooms, loading, error }` | Carga salas para el selector |
| `useCreateEvent` | `hooks/useCreateEvent.ts` | `{ createEvent, isSubmitting, error }` | Maneja la creación de evento |

#### Services (llamadas API)
| Función | Archivo | Endpoint | Headers |
|---------|---------|----------|---------|
| `getAllEvents()` | `services/adminEventService.ts` | `GET /api/v1/events/admin` | `X-Role: ADMIN`, `X-User-Id` |
| `publishEvent(eventId)` | `services/adminEventService.ts` | `PATCH /api/v1/events/:id/publish` | `X-Role: ADMIN`, `X-User-Id` |
| `getAllRooms()` | `services/adminEventService.ts` | `GET /api/v1/rooms` | `X-Role: ADMIN` |
| `createEvent(data)` | `services/adminEventService.ts` | `POST /api/v1/events` | `X-Role: ADMIN`, `X-User-Id` |

#### Service Implementation Pattern
```typescript
// services/adminEventService.ts
import axios from 'axios';
import type { AdminEventsListResponse, EventCreateFormData } from '../types/admin.types';
import type { RoomResponse } from '../types/event.types';

const API_BASE = import.meta.env.VITE_API_URL as string;

function adminHeaders(userId: string) {
  return {
    'X-Role': 'ADMIN',
    'X-User-Id': userId,
  };
}

export async function getAllEvents(userId: string): Promise<AdminEventsListResponse> {
  const res = await axios.get(`${API_BASE}/api/v1/events/admin`, {
    headers: adminHeaders(userId),
  });
  return res.data;
}

export async function publishEvent(eventId: string, userId: string): Promise<void> {
  await axios.patch(`${API_BASE}/api/v1/events/${eventId}/publish`, null, {
    headers: adminHeaders(userId),
  });
}

export async function getAllRooms(userId: string): Promise<RoomResponse[]> {
  const res = await axios.get(`${API_BASE}/api/v1/rooms`, {
    headers: adminHeaders(userId),
  });
  return res.data;
}

export async function createEvent(data: EventCreateFormData, userId: string) {
  const res = await axios.post(`${API_BASE}/api/v1/events`, data, {
    headers: adminHeaders(userId),
  });
  return res.data;
}
```

### Arquitectura y Dependencias
- **Paquetes nuevos requeridos**: ninguno — se usa el stack existente (React 19, Axios, React Router v7, Framer Motion, lucide-react)
- **Servicios externos**: ninguno nuevo
- **Impacto en rutas**: las rutas `/admin/events` y `/admin/events/new` se registran dentro del `AdminLayout` de SPEC-014 (ya previsto)
- **Backend**: los 2 nuevos endpoints se agregan en `EventController` y `RoomController` existentes + 1 nuevo DTO `AdminEventDetailResponse`

### Notas de Implementación

1. **`GET /api/v1/events/admin` vs `GET /api/v1/events?status=all`**: Se opta por un endpoint separado `/events/admin` para evitar romper el contrato público existente de `GET /api/v1/events` (que devuelve solo PUBLISHED). Más explícito y más fácil de proteger con el header `X-Role`.

2. **`AdminEventDetailResponse` vs extender `EventDetailResponse`**: Se crea un nuevo DTO para admin porque el response público no incluye `status`, `updatedAt` ni `createdBy`. Esto mantiene separación de contratos público/admin.

3. **Filtro client-side**: El filtro por estado en el dashboard se hace client-side sobre el array completo de eventos. Esto es adecuado para volúmenes bajos-medios (< 500 eventos). Si el catálogo crece, se puede agregar filtro server-side en una iteración futura.

4. **Selector de sala**: `GET /api/v1/rooms` devuelve todas las salas. El dropdown se monta con `id` como value y `name (maxCapacity)` como label. Al seleccionar, se muestra el `maxCapacity` de referencia.

5. **Formulario de creación**: Usar `EventCreateRequest` del backend directamente. Los campos de metadata opcionales del SPEC-011 (`imageUrl`, `subtitle`, `location`, `director`, `castMembers`, `duration`, `tag`, `isLimited`, `isFeatured`, `author`) se envían como parte del body. Los campos no completados se envían como `null` (o no se incluyen).

6. **Auth headers**: Todas las funciones de `adminEventService.ts` reciben `userId` como parámetro y construyen los headers `X-Role` + `X-User-Id`. El `userId` se obtiene de `useAuth()` (SPEC-014).

7. **Tags sugeridos**: El campo `tag` es un input con datalist de sugerencias: `"FEATURED PERFORMANCE"`, `"LIMITED SEATING"`. El usuario puede escribir texto libre.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### Implementación
- [ ] Crear DTO `AdminEventDetailResponse` — incluye `status`, `createdBy`, `updatedAt` y todos los campos de metadata
- [ ] Implementar `EventService.getAllEvents()` — `findAll()` + mapeo a `AdminEventDetailResponse`
- [ ] Implementar endpoint `GET /api/v1/events/admin` en `EventController` — valida `X-Role: ADMIN`, retorna `{ total, events }`
- [ ] Implementar `RoomService.getAllRooms()` — `findAll()` + mapeo a `RoomResponse`
- [ ] Implementar endpoint `GET /api/v1/rooms` en `RoomController` — valida `X-Role: ADMIN`, retorna `List<RoomResponse>`

#### Tests Backend
- [ ] `test_getAllEventsAdmin_returns_all_statuses` — devuelve DRAFT + PUBLISHED + CANCELLED
- [ ] `test_getAllEventsAdmin_returns_403_without_admin_role` — sin X-Role: ADMIN
- [ ] `test_getAllEventsAdmin_includes_room_and_tiers` — cada evento tiene room y availableTiers
- [ ] `test_getAllEventsAdmin_includes_status_field` — cada evento tiene campo status
- [ ] `test_getAllRooms_returns_all_rooms` — devuelve todas las salas
- [ ] `test_getAllRooms_returns_403_without_admin_role` — sin X-Role: ADMIN
- [ ] `test_getAllRooms_returns_empty_when_no_rooms` — lista vacía

### Frontend

#### Implementación
- [ ] Crear `types/admin.types.ts` — interfaces `AdminEventResponse`, `AdminEventsListResponse`, `EventCreateFormData`, `EventStatus`, `StatusFilter`, props interfaces
- [ ] Crear `services/adminEventService.ts` — `getAllEvents()`, `publishEvent()`, `getAllRooms()`, `createEvent()`
- [ ] Crear `hooks/useAdminEvents.ts` — carga eventos vía admin endpoint, expone `refresh()` y `publishEvent()`
- [ ] Crear `hooks/useRooms.ts` — carga salas para el selector
- [ ] Crear `hooks/useCreateEvent.ts` — maneja submit de creación con loading/error
- [ ] Crear `components/admin/EventStatusBadge/EventStatusBadge.tsx` + CSS Module — badge DRAFT/PUBLISHED/CANCELLED
- [ ] Crear `components/admin/EventForm/EventForm.tsx` + CSS Module — formulario reutilizable con validaciones
- [ ] Crear `components/admin/ImagePreview/ImagePreview.tsx` + CSS Module — preview de URL de imagen con fallback
- [ ] Crear `pages/admin/EventsDashboard/EventsDashboard.tsx` + CSS Module — tabla, filtros, acciones, estado vacío
- [ ] Crear `pages/admin/CreateEventPage/CreateEventPage.tsx` + CSS Module — página del formulario con selector de sala
- [ ] Registrar rutas `/admin/events` → EventsDashboard y `/admin/events/new` → CreateEventPage dentro del AdminLayout

#### Tests Frontend
- [ ] `[EventStatusBadge] renders correct color for each status`
- [ ] `[EventsDashboard] renders table with event data`
- [ ] `[EventsDashboard] filters events by status`
- [ ] `[EventsDashboard] disables publish button when no tiers`
- [ ] `[EventsDashboard] shows empty state when no events`
- [ ] `[EventsDashboard] calls publishEvent on button click`
- [ ] `[EventForm] validates required fields`
- [ ] `[EventForm] validates capacity against room maxCapacity`
- [ ] `[EventForm] validates future date`
- [ ] `[EventForm] submits correct data on valid form`
- [ ] `[CreateEventPage] displays rooms in selector`
- [ ] `[CreateEventPage] redirects after successful creation`
- [ ] `[ImagePreview] shows thumbnail for valid URL`
- [ ] `[ImagePreview] shows placeholder for invalid URL`
- [ ] `[useAdminEvents] loads events on mount`
- [ ] `[useRooms] loads rooms on mount`

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CRITERIO-2.1 a 2.8, CRITERIO-3.1 a 3.9
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Verificar tabla carga todos los eventos (DRAFT + PUBLISHED + CANCELLED)
- [ ] Verificar filtro por estado funciona correctamente (client-side)
- [ ] Verificar badges visuales por estado (DRAFT=amarillo, PUBLISHED=verde, CANCELLED=rojo)
- [ ] Verificar publicación exitosa desde la tabla (badge se actualiza sin recargar)
- [ ] Verificar botón publicar deshabilitado sin tiers (tooltip visible)
- [ ] Verificar estado vacío del dashboard con botón "Crear Primer Evento"
- [ ] Verificar navegación dashboard → crear evento y dashboard → detalle evento
- [ ] Verificar selector de sala poblado con todas las salas
- [ ] Verificar referencia de aforo máximo al seleccionar sala
- [ ] Verificar validación de aforo contra maxCapacity de la sala
- [ ] Verificar validación de fecha futura
- [ ] Verificar validación de campos obligatorios vacíos
- [ ] Verificar creación exitosa con metadata completa → toast + redirect
- [ ] Verificar creación exitosa solo con campos obligatorios
- [ ] Verificar manejo de error 409 (evento duplicado)
- [ ] Verificar manejo de error 404 (sala no encontrada)
- [ ] Verificar preview de imagen con URL válida e inválida
- [ ] Verificar que headers X-Role y X-User-Id se envían en todas las peticiones admin
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar que todas las reglas de negocio están cubiertas
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
