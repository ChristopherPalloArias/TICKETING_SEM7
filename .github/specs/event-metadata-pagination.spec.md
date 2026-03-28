---
id: SPEC-011
status: APPROVED
feature: event-metadata-pagination
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: [SPEC-001, SPEC-003]
---

# Spec: Extensión de Metadata Artística y Paginación en ms-events

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Extensión del modelo `Event` en `ms-events` con 10 campos de metadata artística que el frontend ya consume (imagen, subtítulo, ubicación, director, elenco, duración, etiqueta, flags de limitado/destacado, autor) y adición de paginación real en `GET /api/v1/events`. Ambos cambios son **backend-only** y resuelven brechas bloqueantes entre los contratos frontend (SPEC-008, SPEC-009) y el backend actual.

### Requerimiento de Negocio
Resultado de la auditoría de coherencia entre el frontend implementado y el backend existente en `ms-events`. El frontend ya envía `page`/`pageSize` como query params y espera campos como `imageUrl`, `subtitle`, `location`, `director`, `castMembers`, `duration`, `tag`, `isLimited`, `isFeatured` y `author` en las respuestas de eventos, pero el backend no los soporta.

Fuente: `.github/requirements/integracion-admin-frontend.md` — HU-INT-01 y HU-INT-02.

### Historias de Usuario

#### HU-INT-01: Extensión del modelo Event con metadata artística

```
Como:        Comprador
Quiero:      que los eventos muestren imagen, subtítulo, ubicación, director, elenco, duración, etiqueta editorial, indicador de aforo limitado, indicador de evento destacado y autor
Para:        tener contexto visual y artístico completo antes de decidir si compro una entrada

Prioridad:   Alta
Estimación:  5 SP
Dependencias: HU-01 (entidad Event existente)
Capa:        Backend
```

#### Criterios de Aceptación — HU-INT-01

**Happy Path**
```gherkin
CRITERIO-1.1: Evento creado con metadata artística completa
  Dado que:  el administrador tiene acceso habilitado al sistema (X-Role: ADMIN)
  Cuando:    crea un evento con imageUrl, subtitle, location, director, castMembers, duration, tag, isLimited, isFeatured y author
  Entonces:  el sistema persiste todos los campos junto con los obligatorios
  Y          la respuesta 201 incluye los campos de metadata completos
```

```gherkin
CRITERIO-1.2: Campos de metadata opcionales — creación sin metadata
  Dado que:  el administrador crea un evento con solo los campos obligatorios (roomId, title, description, date, capacity)
  Cuando:    no proporciona ningún campo de metadata artística
  Entonces:  el sistema crea el evento normalmente con status 201
  Y          los campos string de metadata se devuelven como null
  Y          isLimited e isFeatured se devuelven como false
```

```gherkin
CRITERIO-1.3: Metadata visible en el listado de eventos publicados
  Dado que:  existen eventos publicados con metadata artística
  Cuando:    el comprador consulta GET /api/v1/events
  Entonces:  cada evento en la respuesta incluye imageUrl, subtitle, location, director, castMembers, duration, tag, isLimited, isFeatured y author
```

```gherkin
CRITERIO-1.4: Metadata visible en el detalle del evento
  Dado que:  existe un evento publicado con metadata artística completa
  Cuando:    el comprador consulta GET /api/v1/events/{eventId}
  Entonces:  la respuesta incluye imageUrl, subtitle, location, director, castMembers, duration, tag, isLimited, isFeatured y author
```

**Validation Path**
```gherkin
CRITERIO-1.5: Duration validada como entero positivo
  Dado que:  el administrador asigna una duración al evento
  Cuando:    proporciona un valor de 0 o negativo
  Entonces:  el sistema rechaza la creación con HTTP 400 y mensaje "duration: must be greater than or equal to 1"
```

---

#### HU-INT-02: Paginación en el listado de eventos publicados

```
Como:        Comprador
Quiero:      que la cartelera cargue eventos de forma progresiva (paginada)
Para:        no esperar la carga de todo el catálogo y tener una experiencia de navegación fluida

Prioridad:   Alta
Estimación:  3 SP
Dependencias: HU-03 (GET /api/v1/events existente)
Capa:        Backend
```

#### Criterios de Aceptación — HU-INT-02

**Happy Path**
```gherkin
CRITERIO-2.1: Paginación con parámetros page y pageSize
  Dado que:  existen 25 eventos publicados en el sistema
  Cuando:    el comprador solicita GET /api/v1/events?page=1&pageSize=10
  Entonces:  la respuesta contiene los primeros 10 eventos
  Y          incluye los campos: total=25, page=1, pageSize=10, hasMore=true
```

```gherkin
CRITERIO-2.2: Última página sin más resultados
  Dado que:  existen 25 eventos publicados
  Cuando:    el comprador solicita GET /api/v1/events?page=3&pageSize=10
  Entonces:  la respuesta contiene 5 eventos
  Y          incluye hasMore=false
```

```gherkin
CRITERIO-2.3: Valores por defecto cuando no se envían parámetros
  Dado que:  el comprador solicita GET /api/v1/events sin query params
  Cuando:    el backend procesa la petición
  Entonces:  usa page=1 y pageSize=10 por defecto
  Y          la respuesta incluye los campos total, page, pageSize, hasMore
```

```gherkin
CRITERIO-2.4: Orden consistente por fecha de creación descendente
  Dado que:  existen múltiples eventos publicados
  Cuando:    el comprador solicita cualquier página del listado
  Entonces:  los eventos vienen ordenados por created_at descendente (más recientes primero)
```

### Reglas de Negocio
1. Los 10 campos de metadata artística son **opcionales** — nunca tienen `@NotNull`.
2. `duration`, cuando se proporciona, debe ser `>= 1` (minutos). Se valida con `@Min(1)`.
3. `isLimited` e `isFeatured` tienen **default `false`** en la base de datos y en la entidad.
4. `castMembers` se almacena como `VARCHAR(500)` con valores separados por coma (evita el keyword SQL `CAST`).
5. La paginación usa `page` base-1 (el frontend envía 1, 2, 3…). El backend convierte a base-0 para `PageRequest`.
6. `hasMore` se calcula como `page < totalPages`.
7. El orden de paginación es `created_at DESC` (más recientes primero).
8. Los campos de metadata se exponen tanto en `EventDetailResponse` (detalle/listado público) como en `EventResponse` (admin).

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Event` | tabla `event` | modificada | Agrega 10 columnas de metadata artística |

#### Nuevos campos del modelo Event
| Campo | Tipo BD | Tipo Java | Obligatorio | Validación | Descripción |
|-------|---------|-----------|-------------|------------|-------------|
| `image_url` | `VARCHAR(500)` | `String` | no | max 500 chars | URL de imagen del evento |
| `subtitle` | `VARCHAR(300)` | `String` | no | max 300 chars | Subtítulo o tagline |
| `location` | `VARCHAR(300)` | `String` | no | max 300 chars | Ubicación / venue |
| `director` | `VARCHAR(200)` | `String` | no | max 200 chars | Director artístico |
| `cast_members` | `VARCHAR(500)` | `String` | no | max 500 chars | Elenco separado por comas |
| `duration` | `INTEGER` | `Integer` | no | `@Min(1)` cuando presente | Duración en minutos |
| `tag` | `VARCHAR(100)` | `String` | no | max 100 chars | Etiqueta editorial |
| `is_limited` | `BOOLEAN DEFAULT FALSE` | `Boolean` | no | — | Aforo limitado |
| `is_featured` | `BOOLEAN DEFAULT FALSE` | `Boolean` | no | — | Evento destacado |
| `author` | `VARCHAR(200)` | `String` | no | max 200 chars | Autor / dramaturgo |

#### Migración Flyway

**Archivo:** `ms-events/src/main/resources/db/migration/V6__add_event_metadata_fields.sql`

```sql
ALTER TABLE event ADD COLUMN image_url VARCHAR(500);
ALTER TABLE event ADD COLUMN subtitle VARCHAR(300);
ALTER TABLE event ADD COLUMN location VARCHAR(300);
ALTER TABLE event ADD COLUMN director VARCHAR(200);
ALTER TABLE event ADD COLUMN cast_members VARCHAR(500);
ALTER TABLE event ADD COLUMN duration INTEGER;
ALTER TABLE event ADD COLUMN tag VARCHAR(100);
ALTER TABLE event ADD COLUMN is_limited BOOLEAN DEFAULT FALSE;
ALTER TABLE event ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE event ADD COLUMN author VARCHAR(200);

-- Constraint: duration must be >= 1 when not null
ALTER TABLE event ADD CONSTRAINT chk_event_duration CHECK (duration IS NULL OR duration >= 1);
```

#### Índices / Constraints
- `chk_event_duration`: CHECK constraint — `duration IS NULL OR duration >= 1`.
- No se requieren nuevos índices; `idx_event_status` y `idx_event_created_at` (existentes en V1) cubren las queries de paginación.

### API Endpoints

#### POST /api/v1/events (modificado — campos adicionales opcionales)
- **Descripción**: Crea un nuevo evento en estado DRAFT. Acepta campos de metadata opcionales.
- **Auth requerida**: `X-Role: ADMIN`, `X-User-Id`
- **Request Body**:
  ```json
  {
    "roomId": "uuid",
    "title": "BODAS DE SANGRE",
    "description": "Adaptación contemporánea de la obra de Lorca",
    "date": "2026-06-15T20:00:00",
    "capacity": 500,
    "imageUrl": "https://example.com/bodas-de-sangre.jpg",
    "subtitle": "Una tragedia en tres actos",
    "location": "Teatro Real, Madrid",
    "director": "Alejandro G. Iñárritu",
    "castMembers": "Penélope Cruz, Javier Bardem",
    "duration": 120,
    "tag": "Teatro Clásico",
    "isLimited": false,
    "isFeatured": true,
    "author": "Federico García Lorca"
  }
  ```
- **Response 201** (EventResponse):
  ```json
  {
    "id": "uuid",
    "roomId": "uuid",
    "title": "BODAS DE SANGRE",
    "description": "Adaptación contemporánea de la obra de Lorca",
    "date": "2026-06-15T20:00:00",
    "capacity": 500,
    "status": "DRAFT",
    "createdAt": "2026-03-27T10:00:00",
    "updatedAt": "2026-03-27T10:00:00",
    "createdBy": "admin-user-id",
    "imageUrl": "https://example.com/bodas-de-sangre.jpg",
    "subtitle": "Una tragedia en tres actos",
    "location": "Teatro Real, Madrid",
    "director": "Alejandro G. Iñárritu",
    "castMembers": "Penélope Cruz, Javier Bardem",
    "duration": 120,
    "tag": "Teatro Clásico",
    "isLimited": false,
    "isFeatured": true,
    "author": "Federico García Lorca"
  }
  ```
- **Response 400**: campo obligatorio faltante, capacity excede maxCapacity, o duration < 1
- **Response 403**: X-Role no es ADMIN
- **Response 404**: Room no encontrada
- **Response 409**: evento con mismo título y fecha ya existe

#### GET /api/v1/events (modificado — paginación + metadata)
- **Descripción**: Lista eventos publicados con paginación. No requiere autenticación.
- **Query Params**:
  | Param | Tipo | Default | Descripción |
  |-------|------|---------|-------------|
  | `page` | int | 1 | Número de página (base 1) |
  | `pageSize` | int | 10 | Cantidad de eventos por página |
- **Response 200**:
  ```json
  {
    "total": 25,
    "events": [
      {
        "id": "uuid",
        "title": "BODAS DE SANGRE",
        "description": "Adaptación contemporánea de la obra de Lorca",
        "date": "2026-06-15T20:00:00",
        "capacity": 500,
        "room": {
          "id": "uuid",
          "name": "Teatro Real",
          "maxCapacity": 600,
          "createdAt": "2026-01-01T00:00:00",
          "updatedAt": "2026-01-01T00:00:00"
        },
        "availableTiers": [
          {
            "id": "uuid",
            "name": "VIP",
            "price": 120.00,
            "availableQuota": 50
          }
        ],
        "created_at": "2026-03-27T10:00:00",
        "imageUrl": "https://example.com/bodas-de-sangre.jpg",
        "subtitle": "Una tragedia en tres actos",
        "location": "Teatro Real, Madrid",
        "director": "Alejandro G. Iñárritu",
        "castMembers": "Penélope Cruz, Javier Bardem",
        "duration": 120,
        "tag": "Teatro Clásico",
        "isLimited": false,
        "isFeatured": true,
        "author": "Federico García Lorca"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
  ```

#### GET /api/v1/events/{eventId} (modificado — metadata en detalle)
- **Descripción**: Detalle de un evento publicado. No requiere autenticación.
- **Response 200** (EventDetailResponse):
  ```json
  {
    "id": "uuid",
    "title": "BODAS DE SANGRE",
    "description": "Adaptación contemporánea de la obra de Lorca",
    "date": "2026-06-15T20:00:00",
    "capacity": 500,
    "room": {
      "id": "uuid",
      "name": "Teatro Real",
      "maxCapacity": 600,
      "createdAt": "2026-01-01T00:00:00",
      "updatedAt": "2026-01-01T00:00:00"
    },
    "availableTiers": [
      {
        "id": "uuid",
        "name": "VIP",
        "price": 120.00,
        "availableQuota": 50
      }
    ],
    "created_at": "2026-03-27T10:00:00",
    "imageUrl": "https://example.com/bodas-de-sangre.jpg",
    "subtitle": "Una tragedia en tres actos",
    "location": "Teatro Real, Madrid",
    "director": "Alejandro G. Iñárritu",
    "castMembers": "Penélope Cruz, Javier Bardem",
    "duration": 120,
    "tag": "Teatro Clásico",
    "isLimited": false,
    "isFeatured": true,
    "author": "Federico García Lorca"
  }
  ```
- **Response 404**: evento no encontrado o no publicado

### DTO Signatures (Java Records)

#### EventCreateRequest (modificado)
```java
public record EventCreateRequest(
    @NotNull UUID roomId,
    @NotBlank @Size(max = 150) String title,
    @NotBlank @Size(max = 1000) String description,
    @NotNull @FutureOrPresent LocalDateTime date,
    @NotNull @Min(1) Integer capacity,
    // --- metadata fields (all optional) ---
    @Size(max = 500) String imageUrl,
    @Size(max = 300) String subtitle,
    @Size(max = 300) String location,
    @Size(max = 200) String director,
    @Size(max = 500) String castMembers,
    @Min(1) Integer duration,
    @Size(max = 100) String tag,
    Boolean isLimited,
    Boolean isFeatured,
    @Size(max = 200) String author
) {}
```

#### EventDetailResponse (modificado)
```java
public record EventDetailResponse(
    UUID id,
    String title,
    String description,
    LocalDateTime date,
    Integer capacity,
    RoomResponse room,
    List<AvailableTierResponse> availableTiers,
    LocalDateTime created_at,
    // --- metadata fields ---
    String imageUrl,
    String subtitle,
    String location,
    String director,
    String castMembers,
    Integer duration,
    String tag,
    Boolean isLimited,
    Boolean isFeatured,
    String author
) {}
```

#### EventResponse (modificado)
```java
public record EventResponse(
    UUID id,
    UUID roomId,
    String title,
    String description,
    LocalDateTime date,
    Integer capacity,
    EventStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    String createdBy,
    // --- metadata fields ---
    String imageUrl,
    String subtitle,
    String location,
    String director,
    String castMembers,
    Integer duration,
    String tag,
    Boolean isLimited,
    Boolean isFeatured,
    String author
) {}
```

### Cambios en Capas del Servicio

#### EventRepository (modificado)
```java
// Nuevo método con Pageable
Page<Event> findByStatus(EventStatus status, Pageable pageable);

// Método existente se mantiene (usado en otros contextos)
List<Event> findByStatus(EventStatus status);
```

#### EventService.createEvent() — mapeo de nuevos campos
Después de los setters existentes, agregar:
```java
event.setImageUrl(request.imageUrl());
event.setSubtitle(request.subtitle());
event.setLocation(request.location());
event.setDirector(request.director());
event.setCastMembers(request.castMembers());
event.setDuration(request.duration());
event.setTag(request.tag());
event.setIsLimited(request.isLimited() != null ? request.isLimited() : false);
event.setIsFeatured(request.isFeatured() != null ? request.isFeatured() : false);
event.setAuthor(request.author());
```

#### EventService.convertToResponse() — mapeo completo
```java
private EventResponse convertToResponse(Event event) {
    return new EventResponse(
        event.getId(),
        event.getRoomId(),
        event.getTitle(),
        event.getDescription(),
        event.getDate(),
        event.getCapacity(),
        event.getStatus(),
        event.getCreatedAt(),
        event.getUpdatedAt(),
        event.getCreatedBy(),
        event.getImageUrl(),
        event.getSubtitle(),
        event.getLocation(),
        event.getDirector(),
        event.getCastMembers(),
        event.getDuration(),
        event.getTag(),
        event.getIsLimited(),
        event.getIsFeatured(),
        event.getAuthor()
    );
}
```

#### EventService.convertToEventDetailResponse() — mapeo completo
```java
private EventDetailResponse convertToEventDetailResponse(Event event) {
    // ... room + tiers logic unchanged ...
    return new EventDetailResponse(
        event.getId(),
        event.getTitle(),
        event.getDescription(),
        event.getDate(),
        event.getCapacity(),
        roomResponse,
        availableTiers,
        event.getCreatedAt(),
        event.getImageUrl(),
        event.getSubtitle(),
        event.getLocation(),
        event.getDirector(),
        event.getCastMembers(),
        event.getDuration(),
        event.getTag(),
        event.getIsLimited(),
        event.getIsFeatured(),
        event.getAuthor()
    );
}
```

#### EventService.getPublishedEvents(int page, int pageSize) — paginación
```java
@Transactional(readOnly = true)
public Map<String, Object> getPublishedEvents(int page, int pageSize) {
    Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<Event> publishedPage = eventRepository.findByStatus(EventStatus.PUBLISHED, pageable);

    List<EventDetailResponse> events = publishedPage.getContent().stream()
        .map(this::convertToEventDetailResponse)
        .toList();

    Map<String, Object> response = new HashMap<>();
    response.put("total", publishedPage.getTotalElements());
    response.put("events", events);
    response.put("page", page);
    response.put("pageSize", pageSize);
    response.put("hasMore", page < publishedPage.getTotalPages());
    return response;
}
```

#### EventController.getPublishedEvents() — parámetros de paginación
```java
@GetMapping
public ResponseEntity<Map<String, Object>> getPublishedEvents(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int pageSize
) {
    Map<String, Object> response = eventService.getPublishedEvents(page, pageSize);
    return ResponseEntity.ok(response);
}
```

### Diseño Frontend
N/A — Esta spec es **backend-only**. Los cambios frontend se abordan en specs separadas.

### Arquitectura y Dependencias
- **Paquetes nuevos requeridos**: ninguno. `spring-data-jpa` ya incluye soporte para `Page` y `Pageable`.
- **Servicios externos**: ninguno.
- **Impacto en imports**: `EventRepository` necesita importar `org.springframework.data.domain.Page` y `org.springframework.data.domain.Pageable`. `EventService` necesita `PageRequest`, `Sort`.

### Notas de Implementación
1. El paquete base es `com.tickets.events` (NO `com.ticketing.events`).
2. La columna se llama `cast_members` (no `cast`) para evitar conflicto con la palabra reservada SQL `CAST`.
3. En Java, el campo se llama `castMembers` (camelCase) y se mapea con `@Column(name = "cast_members")`.
4. Los booleanos `isLimited` e `isFeatured` deben inicializarse a `false` en la entidad Java cuando el request los envía como `null`.
5. `@Min(1)` en `duration` (dentro de `EventCreateRequest`) aplica solo cuando el valor no es `null` — Jakarta Validation ignora constraints en valores `null` por defecto.
6. El método `List<Event> findByStatus(EventStatus status)` existente en `EventRepository` NO se elimina — se mantiene por retrocompatibilidad. Se agrega la sobrecarga `Page<Event> findByStatus(EventStatus status, Pageable pageable)`.
7. La migración V6 continúa la secuencia existente (V1 → V5 ya existen).

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### Migración de Base de Datos
- [ ] Crear `V6__add_event_metadata_fields.sql` con 10 columnas + constraint `chk_event_duration`

#### Implementación HU-INT-01 (Metadata Artística)
- [ ] `Event.java` — agregar 10 campos: `imageUrl`, `subtitle`, `location`, `director`, `castMembers`, `duration`, `tag`, `isLimited`, `isFeatured`, `author` con anotaciones JPA correspondientes
- [ ] `EventCreateRequest.java` — agregar 10 campos opcionales con validaciones `@Size` y `@Min(1)` en duration
- [ ] `EventDetailResponse.java` — agregar 10 campos de metadata al record
- [ ] `EventResponse.java` — agregar 10 campos de metadata al record
- [ ] `EventService.createEvent()` — mapear los 10 nuevos campos del request a la entidad (booleanos default false si null)
- [ ] `EventService.convertToResponse()` — mapear los 10 campos de la entidad al EventResponse
- [ ] `EventService.convertToEventDetailResponse()` — mapear los 10 campos de la entidad al EventDetailResponse

#### Implementación HU-INT-02 (Paginación)
- [ ] `EventRepository` — agregar `Page<Event> findByStatus(EventStatus status, Pageable pageable)`
- [ ] `EventService.getPublishedEvents()` — cambiar firma a `(int page, int pageSize)`, usar `PageRequest.of(page - 1, pageSize, Sort.by(DESC, "createdAt"))`, retornar `Map<String, Object>` con campos `total`, `events`, `page`, `pageSize`, `hasMore`
- [ ] `EventController.getPublishedEvents()` — agregar `@RequestParam page` (default 1) y `@RequestParam pageSize` (default 10), delegar al service y retornar la respuesta paginada

### Tests Backend
- [ ] Test: crear evento con metadata completa → 201, todos los campos presentes en la respuesta
- [ ] Test: crear evento sin metadata → 201, campos string null, booleanos false
- [ ] Test: crear evento con duration = 0 → 400, error de validación
- [ ] Test: crear evento con duration negativo → 400, error de validación
- [ ] Test: GET /api/v1/events con page=1, pageSize=10 → respuesta paginada correcta con total, page, pageSize, hasMore
- [ ] Test: GET /api/v1/events sin params → usa defaults page=1, pageSize=10
- [ ] Test: GET /api/v1/events última página → hasMore=false
- [ ] Test: GET /api/v1/events/{id} → respuesta incluye los 10 campos de metadata
- [ ] Test: orden de eventos por created_at DESC

### Frontend
N/A — spec backend-only.

### QA
- [ ] Verificar migración Flyway V6 ejecuta sin errores
- [ ] Verificar creación de evento con todos los campos de metadata
- [ ] Verificar creación de evento sin metadata (null + booleanos false)
- [ ] Verificar validación de duration negativo/cero
- [ ] Verificar GET /api/v1/events con paginación (page, pageSize, total, hasMore)
- [ ] Verificar GET /api/v1/events sin params usa defaults
- [ ] Verificar GET /api/v1/events última página → hasMore=false
- [ ] Verificar GET /api/v1/events/{id} incluye metadata completa
- [ ] Verificar orden created_at DESC en listado paginado
