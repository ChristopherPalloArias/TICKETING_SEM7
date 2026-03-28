---
id: SPEC-012
status: DRAFT
feature: frontend-contract-fixes
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: [SPEC-011, SPEC-008, SPEC-009]
---

# Spec: Corrección de Contratos Frontend y Configuración de Desarrollo

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Correcciones puntuales en los tipos TypeScript del frontend para que coincidan exactamente con los DTOs del backend (`ms-events`), y configuración del entorno de desarrollo local (proxy Vite + `.env.example`). Cambios exclusivamente en `frontend/` — sin modificaciones al backend.

### Requerimiento de Negocio
Copiado de `.github/requirements/integracion-admin-frontend.md` — **HU-INT-03**:

> Como **Desarrollador**
> Quiero que los tipos TypeScript del frontend coincidan exactamente con los DTOs del backend y que el entorno de desarrollo local funcione sin configuración manual
> Para evitar errores silenciosos de tipo y permitir onboarding inmediato

### Historias de Usuario

#### HU-INT-03: Corrección de contratos y configuración de desarrollo

```
Como:        Desarrollador
Quiero:      Que los tipos TypeScript del frontend coincidan exactamente con los DTOs del backend
             y que el entorno de desarrollo local funcione sin configuración manual
Para:        Evitar errores silenciosos de tipo y permitir onboarding inmediato

Prioridad:   Alta
Estimación:  S (2 SP)
Dependencias: Ninguna
Capa:        Frontend
```

#### Criterios de Aceptación — HU-INT-03

**Happy Path**
```gherkin
CRITERIO-1.1: TierResponse.price como number en el frontend
  Dado que:  el backend envía price como BigDecimal (serializado como número JSON)
  Cuando:    el frontend deserializa la respuesta
  Entonces:  el campo price tiene tipo number
  Y          no es necesario usar parseFloat() para operaciones aritméticas
```

```gherkin
CRITERIO-1.2: Proxy de desarrollo configurado en Vite
  Dado que:  el desarrollador ejecuta el frontend con npm run dev
  Cuando:    el frontend hace una petición a /api/v1/events
  Entonces:  Vite redirige la petición al api-gateway en localhost:8080
  Y          no se requiere configurar VITE_API_URL manualmente
```

```gherkin
CRITERIO-1.3: Archivo .env.example documenta la variable VITE_API_URL
  Dado que:  un nuevo desarrollador clona el repositorio
  Cuando:    revisa el directorio frontend/
  Entonces:  existe un archivo .env.example con VITE_API_URL=http://localhost:8080
```

```gherkin
CRITERIO-1.4: RoomResponse completo en el frontend
  Dado que:  el backend envía createdAt y updatedAt en RoomResponse
  Cuando:    el frontend recibe la respuesta
  Entonces:  los campos opcionales createdAt y updatedAt están disponibles en el tipo
```

```gherkin
CRITERIO-1.5: EventResponse incluye campos faltantes de mock data
  Dado que:  el backend (tras SPEC-011) envía subtitle, location e isFeatured
  Cuando:    el frontend recibe la respuesta de un evento
  Entonces:  los campos opcionales subtitle, location e isFeatured están disponibles en el tipo
```

**Edge Case**
```gherkin
CRITERIO-1.6: Frontend funciona sin .env.local gracias al proxy
  Dado que:  el desarrollador NO tiene archivo .env.local
  Cuando:    ejecuta npm run dev y el frontend hace peticiones a /api/v1/*
  Entonces:  el proxy de Vite redirige a http://localhost:8080 automáticamente
  Y          la aplicación funciona correctamente
```

### Reglas de Negocio
1. `TierResponse.price` DEBE ser `number` para coincidir con `AvailableTierResponse.java` que usa `BigDecimal` (serializado como JSON `number`).
2. `RoomResponse` DEBE incluir `createdAt` y `updatedAt` como opcionales para coincidir con `RoomResponse.java` que envía `created_at` y `updated_at` (tipo `LocalDateTime`).
3. `EventResponse` DEBE incluir `subtitle`, `location` e `isFeatured` como opcionales para coincidir con los campos de metadata artística definidos en SPEC-011.
4. Todas las llamadas `parseFloat(tier.price)` DEBEN eliminarse y reemplazarse con acceso directo `tier.price` ya que el tipo es `number`.
5. La función `formatPrice` en `TicketTier.tsx` DEBE actualizarse para recibir `number` en lugar de `string`.
6. El proxy de Vite DEBE apuntar a `http://localhost:8080` para redirigir rutas `/api`.
7. El archivo `.env.example` ya existe con el contenido correcto — solo verificar que esté presente.

---

## 2. DISEÑO

### Modelos de Datos

Este spec NO modifica entidades de backend. Solo corrige los tipos TypeScript del frontend para que coincidan con los DTOs existentes del backend.

#### Contratos Backend (referencia — sin cambios)

**`AvailableTierResponse.java`** (ms-events):
```java
public record AvailableTierResponse(
    UUID id,
    TierType tierType,
    BigDecimal price,        // ← serializa como JSON number
    Integer quota,
    LocalDateTime validFrom,
    LocalDateTime validUntil,
    Boolean isAvailable,
    String reason
) {}
```

**`RoomResponse.java`** (ms-events):
```java
public record RoomResponse(
    UUID id,
    String name,
    Integer maxCapacity,
    LocalDateTime created_at, // ← presente en el DTO
    LocalDateTime updated_at  // ← presente en el DTO
) {}
```

#### Tipos TypeScript DESPUÉS del fix

**`frontend/src/types/event.types.ts`** — Estado final completo:

```typescript
export type TierType = "VIP" | "GENERAL" | "EARLY_BIRD";
export type TierAvailabilityReason = "SOLD_OUT" | "EXPIRED" | null;
export type EventDisplayStatus = "DISPONIBLE" | "AGOTADO";

export interface TierResponse {
  id: string;
  tierType: TierType;
  price: number;                    // ← FIX: era string, ahora number
  quota: number;
  validFrom: string | null;
  validUntil: string | null;
  isAvailable: boolean;
  reason: TierAvailabilityReason;
}

export interface RoomResponse {
  id: string;
  name: string;
  maxCapacity: number;
  createdAt?: string;               // ← NUEVO: mapeado de created_at
  updatedAt?: string;               // ← NUEVO: mapeado de updated_at
}

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  room: RoomResponse;
  availableTiers: TierResponse[];
  imageUrl?: string;
  created_at: string;
  tag?: string;
  isLimited?: boolean;
  director?: string;
  cast?: string;
  duration?: number;
  author?: string;
  subtitle?: string;                // ← NUEVO: metadata artística
  location?: string;                // ← NUEVO: metadata artística
  isFeatured?: boolean;             // ← NUEVO: metadata artística
}

export interface UseEventDetailResult {
  event: EventResponse | null;
  loading: boolean;
  error: string | null;
}

export interface EventsListResponse {
  total: number;
  events: EventResponse[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface EventViewModel extends EventResponse {
  displayStatus: EventDisplayStatus;
  minPrice: number | null;
}
```

### API Endpoints

Sin cambios. Este spec solo corrige los tipos del frontend. Los endpoints son los mismos:

- `GET /api/v1/events` — listado paginado
- `GET /api/v1/events/{id}` — detalle de evento

### Diseño Frontend

#### Archivos modificados

| Archivo | Cambio | Descripción |
|---------|--------|-------------|
| `src/types/event.types.ts` | Modificar | `price: string` → `price: number` en `TierResponse`; agregar `createdAt?`, `updatedAt?` a `RoomResponse`; agregar `subtitle?`, `location?`, `isFeatured?` a `EventResponse` |
| `src/hooks/useEventFilters.ts` | Modificar | Eliminar `parseFloat(t.price)` → usar `t.price` directo |
| `src/components/TicketTier/TicketTier.tsx` | Modificar | Cambiar `formatPrice(price: string)` a `formatPrice(price: number)`, eliminar `parseFloat` |
| `src/pages/EventDetail/EventDetail.tsx` | Modificar | Eliminar `parseFloat(tier.price)` → usar `tier.price` directo |
| `src/pages/EventDetail/screens/CheckoutScreen.tsx` | Modificar | Eliminar `parseFloat(tier.price)` → usar `tier.price` directo |
| `vite.config.ts` | Modificar | Agregar `server.proxy` para `/api` → `http://localhost:8080` |
| `.env.example` | Verificar | Ya existe con `VITE_API_URL=http://localhost:8080` — sin cambios necesarios |

#### Cambios detallados por archivo

**1. `src/hooks/useEventFilters.ts`** — línea 37:
```typescript
// ANTES:
.map((t) => parseFloat(t.price));

// DESPUÉS:
.map((t) => t.price);
```

**2. `src/components/TicketTier/TicketTier.tsx`** — función `formatPrice`:
```typescript
// ANTES:
function formatPrice(price: string): string {
  const num = parseFloat(price);
  return isNaN(num) ? price : `$${num.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
}

// DESPUÉS:
function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
}
```

**3. `src/pages/EventDetail/EventDetail.tsx`** — línea ~71:
```typescript
// ANTES:
const tierPrice = parseFloat(tier.price);

// DESPUÉS:
const tierPrice = tier.price;
```

**4. `src/pages/EventDetail/screens/CheckoutScreen.tsx`** — línea ~46:
```typescript
// ANTES:
const tierPrice = parseFloat(tier.price);

// DESPUÉS:
const tierPrice = tier.price;
```

**5. `vite.config.ts`** — Estado final completo:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

**6. `.env.example`** — Ya existe con contenido correcto. Verificar solamente:
```
VITE_API_URL=http://localhost:8080
```

### Arquitectura y Dependencias
- Paquetes nuevos requeridos: ninguno
- Servicios externos: ninguno
- Impacto en punto de entrada de la app: ninguno

### Notas de Implementación
> - `.env.example` ya existe en `frontend/` con el contenido `VITE_API_URL=http://localhost:8080`. No requiere creación, solo verificación.
> - El backend `RoomResponse.java` usa `created_at` y `updated_at` (snake_case). Spring Boot serializa con los nombres del record. Si Jackson está configurado con `SNAKE_CASE`, el frontend recibirá `created_at`/`updated_at`. Si no, recibirá `created_at`/`updated_at` tal cual. Los campos opcionales en el tipo TypeScript deben usar `createdAt?` (camelCase) si hay un mapper, o `created_at?` si se deserializan directamente. Verificar el formato real en runtime.
> - El tipo `Order` en `flow.types.ts` ya tiene `tierPrice: number`, lo cual es consistente con el fix.
> - El tipo `TicketInfo` en `flow.types.ts` ya tiene `price: number`, también consistente.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

> No hay tareas de backend. Este spec es exclusivamente frontend.

### Frontend

#### Implementación
- [ ] Cambiar `price: string` a `price: number` en `TierResponse` (`src/types/event.types.ts`)
- [ ] Agregar `createdAt?: string` y `updatedAt?: string` a `RoomResponse` (`src/types/event.types.ts`)
- [ ] Agregar `subtitle?: string`, `location?: string`, `isFeatured?: boolean` a `EventResponse` (`src/types/event.types.ts`)
- [ ] Eliminar `parseFloat(t.price)` en `useEventFilters.ts` → reemplazar con `t.price`
- [ ] Actualizar `formatPrice` en `TicketTier.tsx` — cambiar firma a `(price: number): string`, eliminar `parseFloat` y guard `isNaN`
- [ ] Eliminar `parseFloat(tier.price)` en `EventDetail.tsx` → reemplazar con `tier.price`
- [ ] Eliminar `parseFloat(tier.price)` en `CheckoutScreen.tsx` → reemplazar con `tier.price`
- [ ] Agregar `server.proxy` en `vite.config.ts` — proxy `/api` → `http://localhost:8080` con `changeOrigin: true`
- [ ] Verificar que `frontend/.env.example` existe con `VITE_API_URL=http://localhost:8080`

#### Tests Frontend
- [ ] Verificar que TypeScript compila sin errores (`npx tsc --noEmit`)
- [ ] Verificar que `tier.price` se usa como `number` sin coerción en los componentes modificados
- [ ] Verificar que `npm run dev` arranca correctamente con el proxy configurado
- [ ] Verificar que las peticiones a `/api/v1/events` se redirigen al gateway via proxy

### QA
- [ ] Verificar que `price` se opera como number sin coerción en el checkout
- [ ] Verificar que el frontend arranca con `npm run dev` sin `.env.local` (proxy activo)
- [ ] Verificar que el frontend arranca con `.env.local` configurado (variable directa)
- [ ] Verificar que `.env.example` existe y tiene el contenido correcto
- [ ] Verificar que los nuevos campos opcionales (`subtitle`, `location`, `isFeatured`, `createdAt`, `updatedAt`) no causan errores cuando son `undefined`
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
