---
id: SPEC-016
status: APPROVED
feature: admin-tiers-publish-flow
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: [SPEC-011, SPEC-014, SPEC-015]
---

# Spec: Configuración de Tiers, Publicación y Flujo Completo Admin

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Configuración de tiers (VIP, General, Early Bird) con precios y cupos desde el panel de administración, publicación de eventos desde la vista de detalle y flujo integrado de creación a publicación. Incluye dos nuevos endpoints backend (agregar tier individual y eliminar tier individual), componentes frontend dedicados (TierForm, TierCard, CapacityBar, Breadcrumbs) y la página EventDetailAdmin. Cubre HU-ADM-04 (5 SP) y HU-ADM-05 (2 SP) del requerimiento de integración admin-frontend.

### Requerimiento de Negocio
Fuente: `.github/requirements/integracion-admin-frontend.md` — **HU-ADM-04** (Configuración de tiers y precios desde el panel, 5 SP) y **HU-ADM-05** (Flujo completo admin — de creación a publicación, 2 SP).

El administrador necesita:
1. Configurar tiers individualmente (tipo, precio, cupo, vigencia temporal para Early Bird) desde el detalle de un evento DRAFT.
2. Visualizar cupo asignado vs aforo total con barra de progreso.
3. Eliminar tiers individuales de eventos en estado DRAFT.
4. Publicar el evento desde el detalle con modal de confirmación.
5. Navegar con breadcrumbs por todo el panel admin.
6. Completar el flujo integrado: Login → Dashboard → Crear → Detalle + Tiers → Publicar → Visible en /eventos.

### Historias de Usuario

#### HU-ADM-04: Configuración de tiers y precios desde el panel

```
Como:        Administrador
Quiero:      configurar los tiers (VIP, General, Early Bird), sus cupos y precios desde el detalle del evento
Para:        definir la estructura comercial antes de publicar el evento

Prioridad:   Alta
Estimación:  5 SP
Dependencias: SPEC-014 (auth + AdminLayout), SPEC-015 (crear evento + dashboard + adminEventService)
Capa:        Ambas (backend — 2 endpoints nuevos; frontend — página + 3 componentes)
```

#### Criterios de Aceptación — HU-ADM-04

**Happy Path**

```gherkin
CRITERIO-4.1: Vista de detalle del evento con gestión de tiers
  Dado que:  el administrador está autenticado y accede a /admin/events/:id
  Cuando:    la vista carga
  Entonces:  se muestra la información del evento (título, fecha, sala, aforo, estado, metadata)
  Y          debajo se muestra la sección "Configuración de Tiers"
  Y          si no hay tiers configurados se muestra "No hay tiers configurados aún" + botón "Agregar Tier"
  Y          si hay tiers se muestran como lista de TierCard + CapacityBar
```

```gherkin
CRITERIO-4.2: Agregar nuevo tier al evento
  Dado que:  el administrador está en el detalle de un evento DRAFT
  Cuando:    hace clic en "Agregar Tier"
  Entonces:  aparece un formulario con: Tipo (VIP/GENERAL/EARLY_BIRD dropdown), Precio (number), Cupo (number)
  Y          si el tipo seleccionado es EARLY_BIRD aparecen campos adicionales: Fecha inicio + Fecha fin de vigencia
  Y          al enviar el formulario se llama a POST /api/v1/events/:id/tiers/add con X-Role + X-User-Id
  Y          si es exitoso el tier aparece en la lista sin recargar la página
```

```gherkin
CRITERIO-4.3: Publicar directamente desde la vista de detalle
  Dado que:  el evento está en DRAFT y tiene al menos un tier configurado
  Cuando:    el administrador hace clic en "Publicar Evento"
  Entonces:  se muestra un modal de confirmación: "¿Publicar este evento? Una vez publicado será visible para los compradores."
  Y          al confirmar se llama a PATCH /api/v1/events/:id/publish con header X-Role: ADMIN
  Y          el estado cambia a PUBLISHED y la interfaz se actualiza (tiers + botones deshabilitados)
```

```gherkin
CRITERIO-4.4: Lista de tiers configurados con acciones
  Dado que:  el evento tiene tiers configurados
  Cuando:    se renderiza la sección de tiers
  Entonces:  se muestran los tiers como tarjetas con: tipo (badge), precio, cupo, vigencia (si Early Bird)
  Y          se muestra barra de progreso: cupo total asignado vs aforo del evento
  Y          cada tier tiene un botón "Eliminar" (solo si el evento es DRAFT)
```

```gherkin
CRITERIO-4.5: Vigencia temporal del Early Bird
  Dado que:  el administrador agrega un tier EARLY_BIRD
  Cuando:    define fecha inicio y fecha fin de vigencia
  Entonces:  las fechas se envían como validFrom y validUntil al backend
  Y          las fechas se muestran en la TierCard correspondiente
```

**Error Path**

```gherkin
CRITERIO-4.6: Cupos exceden aforo del evento
  Dado que:  el evento tiene aforo = 200 y tiers con cupos sumando 150
  Cuando:    el administrador intenta agregar un tier con cupo = 60
  Entonces:  el formulario muestra error: "La suma de cupos (210) excede el aforo del evento (200)"
  Y          no se permite enviar el formulario
```

```gherkin
CRITERIO-4.7: Precio inválido
  Dado que:  el administrador ingresa un precio para un tier
  Cuando:    el precio es menor o igual a cero
  Entonces:  se muestra error inline: "El precio debe ser mayor a $0"
  Y          el botón Guardar se deshabilita
```

```gherkin
CRITERIO-4.8: Early Bird con fechas inválidas
  Dado que:  el administrador agrega un tier EARLY_BIRD
  Cuando:    la fecha inicio es posterior a la fecha fin
  Entonces:  se muestra error de validación: "La fecha de inicio debe ser anterior a la fecha de fin"
  Y          no se permite enviar el formulario
```

```gherkin
CRITERIO-4.9: Cupo menor o igual a cero
  Dado que:  el administrador ingresa un cupo para un tier
  Cuando:    el cupo es menor o igual a cero
  Entonces:  se muestra error inline: "El cupo debe ser mayor a 0"
```

**Edge Case**

```gherkin
CRITERIO-4.10: Edición/eliminación bloqueada en evento PUBLISHED
  Dado que:  el evento está en estado PUBLISHED
  Cuando:    se renderiza la página de detalle admin
  Entonces:  el botón "Agregar Tier" no se muestra
  Y          los botones "Eliminar" de cada TierCard no se muestran
  Y          el botón "Publicar Evento" no se muestra
  Y          se muestra un badge "PUBLISHED" indicando el estado
```

```gherkin
CRITERIO-4.11: Publicar evento sin tiers configurados
  Dado que:  el evento está en DRAFT y no tiene tiers
  Cuando:    se renderiza la página de detalle admin
  Entonces:  el botón "Publicar Evento" está deshabilitado
  Y          se muestra un tooltip: "Configura al menos un tier antes de publicar"
```

#### HU-ADM-05: Flujo completo admin — de creación a publicación

```
Como:        Administrador
Quiero:      poder completar todo el ciclo de vida de un evento (crear → configurar tiers → publicar) sin salir del panel
Para:        gestionar eficientemente el catálogo de obras de teatro

Prioridad:   Media
Estimación:  2 SP
Dependencias: SPEC-014 (auth), SPEC-015 (dashboard + crear), HU-ADM-04 (tiers + publicar)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-ADM-05

**Happy Path**

```gherkin
CRITERIO-5.1: Flujo completo sin interrupciones
  Dado que:  el administrador está autenticado en /admin/events
  Cuando:    hace clic en "Crear Evento" y completa el formulario con datos válidos
  Entonces:  es redirigido al detalle del evento (/admin/events/:id)
  Cuando:    agrega tiers con precios y cupos válidos
  Y          hace clic en "Publicar Evento" y confirma
  Entonces:  el evento aparece como PUBLISHED en el dashboard
  Y          el evento es visible en la cartelera pública (/eventos)
```

```gherkin
CRITERIO-5.2: Navegación con breadcrumbs
  Dado que:  el administrador navega por el panel
  Cuando:    está en cualquier sub-ruta de /admin/
  Entonces:  se muestran breadcrumbs: Admin > Eventos > [Crear / nombre del evento]
  Y          cada segmento es clicable para navegar
```

```gherkin
CRITERIO-5.3: Separación visual entre panel admin y tienda pública
  Dado que:  el administrador navega por /admin/*
  Cuando:    las páginas se renderizan
  Entonces:  el layout usa AdminNavBar (de SPEC-014) + Breadcrumbs
  Y          NO se muestra el BottomNav de la tienda pública
  Y          el color de acento distingue claramente el contexto admin
```

**Edge Case**

```gherkin
CRITERIO-5.4: Dashboard sin eventos (estado vacío)
  Dado que:  no existen eventos en el sistema
  Cuando:    el administrador accede al dashboard
  Entonces:  se muestra un estado vacío con ilustración + "No hay eventos aún. ¡Crea tu primer evento para comenzar!"
  Y          se muestra un botón "Crear Primer Evento" que navega a /admin/events/new
```

### Reglas de Negocio

1. **Cupo vs Aforo**: La suma de cupos de todos los tiers de un evento NO puede exceder el `capacity` del evento. Validación tanto en frontend (tiempo real) como en backend.
2. **Estado DRAFT requerido**: Solo se pueden agregar/eliminar tiers en eventos con estado `DRAFT`. Eventos `PUBLISHED` o `CANCELLED` no permiten modificación de tiers.
3. **Precio positivo**: `price > 0` (mínimo $0.01). Validado con `@DecimalMin("0.01")` en backend y client-side en frontend.
4. **Cupo positivo**: `quota >= 1`. Validado con `@Min(1)` en backend y client-side en frontend.
5. **Early Bird vigencia**: Si `tierType == EARLY_BIRD`, entonces `validFrom` y `validUntil` son obligatorios y `validFrom < validUntil`. Ambos deben ser fechas futuras o presentes.
6. **Publicación requiere tiers**: Un evento solo puede transicionar de `DRAFT` a `PUBLISHED` si tiene al menos un tier configurado (validado en backend, endpoint existente `PATCH /api/v1/events/:id/publish`).
7. **Headers admin obligatorios**: Todas las peticiones admin incluyen `X-Role: ADMIN` y `X-User-Id: <uuid>`.
8. **BottomNav oculto**: El componente `BottomNav` de la tienda pública NO se renderiza en rutas `/admin/*`.
9. **Breadcrumbs dinámicos**: Generados a partir de la ruta actual. Segmentos: Admin > Eventos > [Crear | Título del evento].

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Tier` | tabla `tier` | sin cambios | Entidad existente — uuid, event_id, tier_type, price, quota, valid_from, valid_until, created_at, updated_at, version |
| `Event` | tabla `event` | sin cambios | Entidad existente — se lee status, capacity y metadata para renderizar detalle admin |

> No se crean ni modifican entidades. Los dos nuevos endpoints operan sobre la entidad `Tier` existente.

#### Campos del modelo Tier (existente — referencia)

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `id` | UUID | sí | auto-generado | Identificador único |
| `event_id` | UUID (FK) | sí | FK → event.id | Evento al que pertenece |
| `tier_type` | ENUM (VARCHAR 20) | sí | VIP, GENERAL, EARLY_BIRD | Tipo de tier |
| `price` | DECIMAL(10,2) | sí | >= 0.01 | Precio del tier |
| `quota` | INTEGER | sí | >= 1 | Cupo del tier |
| `valid_from` | TIMESTAMP | no | future_or_present | Inicio vigencia (Early Bird) |
| `valid_until` | TIMESTAMP | no | future_or_present | Fin vigencia (Early Bird) |
| `created_at` | TIMESTAMP (UTC) | sí | auto-generado | Timestamp creación |
| `updated_at` | TIMESTAMP (UTC) | sí | auto-generado | Timestamp actualización |
| `version` | BIGINT | sí | auto-gestionado | Optimistic locking |

#### Índices / Constraints
- `idx_tier_event_id` en `event_id` — ya existente, búsqueda frecuente por evento.
- `fk_tier_event` FK `event_id → event.id` — ya existente.

### API Endpoints

#### POST /api/v1/events/{eventId}/tiers/add *(NUEVO)*
- **Descripción**: Agrega un tier individual a un evento en estado DRAFT. Valida que la suma total de cupos no exceda el aforo.
- **Auth requerida**: `X-Role: ADMIN`, `X-User-Id: <uuid>`
- **Path params**: `eventId` (UUID)
- **Request Body**:
  ```json
  {
    "tierType": "VIP | GENERAL | EARLY_BIRD",
    "price": 120.00,
    "quota": 50,
    "validFrom": "2026-04-15T00:00:00",
    "validUntil": "2026-04-30T23:59:59"
  }
  ```
  > `validFrom` y `validUntil` solo requeridos si `tierType == EARLY_BIRD`.
- **Response 201**:
  ```json
  {
    "id": "uuid",
    "tierType": "VIP",
    "price": 120.00,
    "quota": 50,
    "validFrom": null,
    "validUntil": null,
    "createdAt": "2026-03-27T10:00:00",
    "updatedAt": "2026-03-27T10:00:00"
  }
  ```
- **Response 400**: datos inválidos (precio ≤ 0, cupo ≤ 0, validFrom >= validUntil para Early Bird)
- **Response 403**: rol no es ADMIN
- **Response 404**: evento no encontrado
- **Response 409**: la suma de cupos excede el aforo del evento
- **Response 409**: el evento no está en estado DRAFT

#### DELETE /api/v1/events/{eventId}/tiers/{tierId} *(NUEVO)*
- **Descripción**: Elimina un tier individual de un evento en estado DRAFT.
- **Auth requerida**: `X-Role: ADMIN`, `X-User-Id: <uuid>`
- **Path params**: `eventId` (UUID), `tierId` (UUID)
- **Response 204**: tier eliminado exitosamente
- **Response 403**: rol no es ADMIN
- **Response 404**: evento no encontrado o tier no encontrado
- **Response 409**: el evento no está en estado DRAFT

#### Endpoints existentes utilizados (sin cambios)

| Método | Ruta | Descripción | Cambios |
|--------|------|-------------|---------|
| `GET` | `/api/v1/events/{eventId}/tiers` | Obtener tiers del evento | Ninguno |
| `PATCH` | `/api/v1/events/{eventId}/publish` | Publicar evento | Ninguno |
| `GET` | `/api/v1/events/{eventId}` | Detalle del evento | Ninguno |

### Diseño Frontend

#### TypeScript Interfaces

```typescript
// types/admin.types.ts (nuevos tipos para el panel admin)

export interface TierFormData {
  tierType: 'VIP' | 'GENERAL' | 'EARLY_BIRD';
  price: number;
  quota: number;
  validFrom?: string;      // ISO 8601 — solo si EARLY_BIRD
  validUntil?: string;     // ISO 8601 — solo si EARLY_BIRD
}

export interface AdminTierResponse {
  id: string;
  tierType: 'VIP' | 'GENERAL' | 'EARLY_BIRD';
  price: number;
  quota: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TierConfigurationResponse {
  eventId: string;
  tiers: AdminTierResponse[];
}

export interface BreadcrumbSegment {
  label: string;
  path: string;
}
```

#### Componentes nuevos

| Componente | Archivo | Props | Estilos | Descripción |
|------------|---------|-------|---------|-------------|
| `TierForm` | `components/admin/TierForm/TierForm.tsx` | `TierFormProps` | `TierForm.module.css` | Formulario para agregar tier individual |
| `TierCard` | `components/admin/TierCard/TierCard.tsx` | `TierCardProps` | `TierCard.module.css` | Tarjeta de tier configurado con acción eliminar |
| `CapacityBar` | `components/admin/CapacityBar/CapacityBar.tsx` | `CapacityBarProps` | `CapacityBar.module.css` | Barra de progreso cupo asignado / aforo |
| `Breadcrumbs` | `components/admin/Breadcrumbs/Breadcrumbs.tsx` | `BreadcrumbsProps` | `Breadcrumbs.module.css` | Navegación jerárquica por ruta |
| `PublishModal` | `components/admin/PublishModal/PublishModal.tsx` | `PublishModalProps` | `PublishModal.module.css` | Modal de confirmación de publicación |

##### Props TypeScript

```typescript
// components/admin/TierForm/TierForm.tsx
interface TierFormProps {
  eventId: string;
  eventCapacity: number;
  currentTotalQuota: number;   // suma de cupos de tiers existentes
  onTierAdded: (tier: AdminTierResponse) => void;
  onCancel: () => void;
}

// components/admin/TierCard/TierCard.tsx
interface TierCardProps {
  tier: AdminTierResponse;
  isDraft: boolean;            // habilita/deshabilita botón eliminar
  onDelete: (tierId: string) => void;
}

// components/admin/CapacityBar/CapacityBar.tsx
interface CapacityBarProps {
  assignedQuota: number;       // suma de cupos de tiers
  totalCapacity: number;       // aforo del evento
}

// components/admin/Breadcrumbs/Breadcrumbs.tsx
interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

// components/admin/PublishModal/PublishModal.tsx
interface PublishModalProps {
  isOpen: boolean;
  eventTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}
```

#### Páginas nuevas

| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `EventDetailAdmin` | `pages/admin/EventDetailAdmin/EventDetailAdmin.tsx` | `/admin/events/:id` | sí (AdminGuard de SPEC-014) |

> Las rutas `/admin/events` y `/admin/events/new` fueron registradas en SPEC-015. La ruta `/admin/events/:id` ya fue referenciada en SPEC-015 pero su implementación corresponde a esta spec.

#### Estilos de la página

| Archivo | Descripción |
|---------|-------------|
| `pages/admin/EventDetailAdmin/EventDetailAdmin.module.css` | Layout del detalle admin: sección info + sección tiers |

#### Hooks y State

| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useEventTiers` | `hooks/admin/useEventTiers.ts` | `{ tiers, loading, error, addTier, deleteTier, refresh }` | CRUD individual de tiers para un evento |
| `useBreadcrumbs` | `hooks/admin/useBreadcrumbs.ts` | `{ segments: BreadcrumbSegment[] }` | Genera breadcrumbs a partir de la ruta actual y título del evento |

##### Hook Signatures

```typescript
// hooks/admin/useEventTiers.ts
interface UseEventTiersReturn {
  tiers: AdminTierResponse[];
  loading: boolean;
  error: string | null;
  addTier: (data: TierFormData) => Promise<void>;
  deleteTier: (tierId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function useEventTiers(eventId: string): UseEventTiersReturn;

// hooks/admin/useBreadcrumbs.ts
function useBreadcrumbs(eventTitle?: string): { segments: BreadcrumbSegment[] };
```

#### Services (llamadas API)

> Se extiende `services/adminEventService.ts` creado en SPEC-015.

| Función | Archivo | Endpoint | Método |
|---------|---------|----------|--------|
| `addTier(eventId, data)` | `services/adminEventService.ts` | `POST /api/v1/events/:id/tiers/add` | POST |
| `deleteTier(eventId, tierId)` | `services/adminEventService.ts` | `DELETE /api/v1/events/:id/tiers/:tierId` | DELETE |
| `getEventTiers(eventId)` | `services/adminEventService.ts` | `GET /api/v1/events/:id/tiers` | GET |
| `publishEvent(eventId)` | `services/adminEventService.ts` | `PATCH /api/v1/events/:id/publish` | PATCH |

```typescript
// Extensión de services/adminEventService.ts

export async function addTier(eventId: string, data: TierFormData): Promise<AdminTierResponse> {
  const { role, userId } = getAdminSession();
  const res = await axios.post<AdminTierResponse>(
    `${API_BASE}/api/v1/events/${eventId}/tiers/add`,
    data,
    { headers: { 'X-Role': role, 'X-User-Id': userId } }
  );
  return res.data;
}

export async function deleteTier(eventId: string, tierId: string): Promise<void> {
  const { role, userId } = getAdminSession();
  await axios.delete(
    `${API_BASE}/api/v1/events/${eventId}/tiers/${tierId}`,
    { headers: { 'X-Role': role, 'X-User-Id': userId } }
  );
}

export async function getEventTiers(eventId: string): Promise<TierConfigurationResponse> {
  const res = await axios.get<TierConfigurationResponse>(
    `${API_BASE}/api/v1/events/${eventId}/tiers`
  );
  return res.data;
}
```

### Arquitectura y Dependencias

#### Backend (`ms-events`)
- **Paquetes modificados**: `com.tickets.events.controller.TierController`, `com.tickets.events.service.TierService`
- **Paquetes sin cambios**: `com.tickets.events.repository.TierRepository` (ya tiene `findByIdAndEventId`), `com.tickets.events.model.Tier`, `com.tickets.events.dto.TierCreateRequest`
- **Sin paquetes nuevos**: se reutilizan DTOs existentes (`TierCreateRequest`, `TierResponse`)

#### Frontend
- **Paquetes nuevos**: ninguno (Framer Motion y lucide-react ya disponibles)
- **Dependencias internas**: `useAuth()` de SPEC-014, `AdminLayout` de SPEC-014, `adminEventService` de SPEC-015
- **Impacto en App.tsx**: La ruta `/admin/events/:id` ya fue registrada en SPEC-015 como parte del layout admin. Solo se necesita conectar `EventDetailAdmin` como `element`.
- **AdminLayout**: Se añade `<Breadcrumbs />` dentro del layout wrapper, encima del `<Outlet />`, para que aparezca en todas las páginas admin.

### Notas de Implementación

1. **Backend — Endpoint POST /add vs POST existente**: El endpoint existente `POST /api/v1/events/:id/tiers` acepta `List<TierCreateRequest>` y rechaza si ya existen tiers (409). El nuevo endpoint `POST /api/v1/events/:id/tiers/add` acepta un solo `TierCreateRequest` y es aditivo — no se rechaza si ya hay tiers. Ambos endpoints validan que la suma total de cupos no exceda el aforo.

2. **Backend — DELETE individual vs DELETE bulk**: El endpoint existente `DELETE /api/v1/events/:id/tiers` elimina todos los tiers. El nuevo `DELETE /api/v1/events/:id/tiers/:tierId` elimina uno solo. Ambos requieren estado DRAFT y rol ADMIN.

3. **Frontend — price como number**: El backend serializa `BigDecimal` como número JSON. La interfaz `AdminTierResponse` usa `price: number`. No usar `parseFloat()`.

4. **Frontend — CapacityBar colores**: Verde (`<80%`), Amarillo (`80-100%`), Rojo (intento de overflow `>100%`). Usar CSS custom properties de tokens existentes.

5. **Frontend — Breadcrumbs dinámicos**: Usar `useLocation()` + `useParams()` de React Router. Segmentos fijos: `Admin` → `/admin/events`, `Eventos` → `/admin/events`. Último segmento dinámico: "Crear" si ruta es `/new`, o título del evento si es `/:id`.

6. **TierForm — Validación de cupo en tiempo real**: El formulario recibe `currentTotalQuota` como prop. Al ingresar cupo, calcula `currentTotalQuota + nuevoQuota` y compara con `eventCapacity`. Si excede → error inline sin llamar al backend.

7. **TierCard — Badge por tipo**: VIP → badge morado, GENERAL → badge azul, EARLY_BIRD → badge naranja. Mapear colores a clases CSS Module.

8. **PublishModal — Framer Motion**: Usar `AnimatePresence` + `motion.div` para la animación de entrada/salida del modal, consistente con modales de la tienda pública.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### Implementación
- [ ] Agregar método `addSingleTier(UUID eventId, TierCreateRequest request, String role, String userId)` en `TierService.java` — valida ADMIN, estado DRAFT, suma de cupos ≤ capacity, crea y persiste un solo tier
- [ ] Agregar método `deleteSingleTier(UUID eventId, UUID tierId, String role, String userId)` en `TierService.java` — valida ADMIN, estado DRAFT, verifica que el tier existe con `findByIdAndEventId`, elimina el tier
- [ ] Agregar endpoint `@PostMapping("/{eventId}/tiers/add")` en `TierController.java` — recibe `@Valid @RequestBody TierCreateRequest`, headers `X-Role` + `X-User-Id`, retorna `ResponseEntity<TierResponse>` 201
- [ ] Agregar endpoint `@DeleteMapping("/{eventId}/tiers/{tierId}")` en `TierController.java` — recibe headers `X-Role` + `X-User-Id`, retorna `ResponseEntity<Void>` 204
- [ ] Agregar método auxiliar `calculateCurrentTotalQuota(UUID eventId)` en `TierService.java` — suma los quotas de tiers existentes para el evento

#### Tests Backend
- [ ] `test_addSingleTier_success` — happy path: agregar tier a evento DRAFT sin exceder aforo
- [ ] `test_addSingleTier_quotaExceedsCapacity` — error 409: suma de cupos excede aforo
- [ ] `test_addSingleTier_eventNotDraft` — error 409: evento no en DRAFT
- [ ] `test_addSingleTier_eventNotFound` — error 404
- [ ] `test_addSingleTier_forbiddenNonAdmin` — error 403: sin X-Role ADMIN
- [ ] `test_addSingleTier_earlyBirdWithDates` — happy path Early Bird con validFrom/validUntil
- [ ] `test_deleteSingleTier_success` — happy path: eliminar tier de evento DRAFT
- [ ] `test_deleteSingleTier_tierNotFound` — error 404
- [ ] `test_deleteSingleTier_eventNotDraft` — error 409
- [ ] `test_deleteSingleTier_forbiddenNonAdmin` — error 403

### Frontend

#### Implementación
- [ ] Crear `types/admin.types.ts` con interfaces: `TierFormData`, `AdminTierResponse`, `TierConfigurationResponse`, `BreadcrumbSegment`
- [ ] Agregar funciones `addTier()`, `deleteTier()`, `getEventTiers()` en `services/adminEventService.ts`
- [ ] Crear `hooks/admin/useEventTiers.ts` — consume `adminEventService`, gestiona estado de tiers
- [ ] Crear `hooks/admin/useBreadcrumbs.ts` — genera segmentos desde ruta actual + título evento
- [ ] Crear `components/admin/TierForm/TierForm.tsx` + `TierForm.module.css` — formulario con campos condicionales Early Bird, validación tiempo real de cupo vs aforo
- [ ] Crear `components/admin/TierCard/TierCard.tsx` + `TierCard.module.css` — badge por tipo, precio, cupo, fechas, botón eliminar condicional
- [ ] Crear `components/admin/CapacityBar/CapacityBar.tsx` + `CapacityBar.module.css` — barra progreso con colores dinámicos (verde/amarillo/rojo)
- [ ] Crear `components/admin/Breadcrumbs/Breadcrumbs.tsx` + `Breadcrumbs.module.css` — navegación jerárquica clicable
- [ ] Crear `components/admin/PublishModal/PublishModal.tsx` + `PublishModal.module.css` — modal de confirmación con Framer Motion
- [ ] Crear `pages/admin/EventDetailAdmin/EventDetailAdmin.tsx` + `EventDetailAdmin.module.css` — info del evento + sección tiers + botón publicar
- [ ] Integrar `<Breadcrumbs />` en AdminLayout (encima del `<Outlet />`)
- [ ] Verificar que BottomNav NO se renderiza en rutas `/admin/*`
- [ ] Conectar ruta `/admin/events/:id` a `EventDetailAdmin` en el sistema de rutas

#### Tests Frontend
- [ ] `[TierForm] renders dropdown with VIP, GENERAL, EARLY_BIRD options`
- [ ] `[TierForm] shows validFrom/validUntil fields only when EARLY_BIRD selected`
- [ ] `[TierForm] shows error when quota + current exceeds capacity`
- [ ] `[TierForm] shows error when price <= 0`
- [ ] `[TierForm] calls onTierAdded on successful submit`
- [ ] `[TierCard] renders tier type badge, price, and quota`
- [ ] `[TierCard] renders validFrom/validUntil for EARLY_BIRD tier`
- [ ] `[TierCard] hides delete button when isDraft is false`
- [ ] `[TierCard] calls onDelete with tierId when delete clicked`
- [ ] `[CapacityBar] renders green bar when usage < 80%`
- [ ] `[CapacityBar] renders yellow bar when usage 80-100%`
- [ ] `[CapacityBar] renders "X / Y asignados" label`
- [ ] `[Breadcrumbs] renders clickable segments from route`
- [ ] `[PublishModal] shows confirmation text with event title`
- [ ] `[PublishModal] calls onConfirm when confirm button clicked`
- [ ] `[EventDetailAdmin] renders event info and tier section`
- [ ] `[EventDetailAdmin] shows empty state when no tiers`
- [ ] `[EventDetailAdmin] disables tier management when event is PUBLISHED`
- [ ] `[useEventTiers] loads tiers on mount`
- [ ] `[useEventTiers] addTier updates list without page reload`

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CRITERIO-4.1 a CRITERIO-4.11, CRITERIO-5.1 a CRITERIO-5.4
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Verificar flujo completo: Login → Dashboard → Crear → Detalle + Tiers → Publicar → Visible en /eventos
- [ ] Verificar agregar tier VIP con precio y cupo válidos
- [ ] Verificar agregar tier EARLY_BIRD con vigencia temporal
- [ ] Verificar rechazo por suma de cupos > aforo del evento
- [ ] Verificar rechazo por precio ≤ 0
- [ ] Verificar rechazo por cupo ≤ 0
- [ ] Verificar barra de progreso (colores verde/amarillo/rojo)
- [ ] Verificar publicación exitosa desde detalle con modal de confirmación
- [ ] Verificar que no se pueden editar/eliminar tiers de evento PUBLISHED
- [ ] Verificar eliminación individual de tier en evento DRAFT
- [ ] Verificar breadcrumbs navegables en /admin/events, /admin/events/new, /admin/events/:id
- [ ] Verificar estado vacío cuando no hay eventos en el dashboard
- [ ] Verificar que BottomNav NO aparece en rutas /admin/*
- [ ] Verificar separación visual entre admin y tienda pública
- [ ] Verificar headers X-Role y X-User-Id en peticiones admin (POST add tier, DELETE tier, PATCH publish)
