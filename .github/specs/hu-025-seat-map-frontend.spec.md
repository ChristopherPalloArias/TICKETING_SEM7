---
id: SPEC-025
status: APPROVED
feature: seat-map-frontend
created: 2026-04-02
updated: 2026-04-02
author: spec-generator
version: "1.0"
related-specs: [SPEC-024]
---

# Spec: Interfaz de Selección de Asientos (SeatMap Frontend)

> **Estado:** `APPROVED` → Implementación en progreso (FASE 3)
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED
> **Stack:** React 19 + TypeScript + Vite + CSS Modules (no Tailwind)

---

## 1. REQUERIMIENTOS

### Descripción
Implementar un componente frontend visual interactivo que permita a los compradores seleccionar asientos específicos de un evento antes del pago, reemplazando la selección tradicional de cantidad por tier. Incluye validación de estado concurrente, fallback a modalidad cuota (backward compatible) y integración bidireccional con el API backend.

### Requerimiento de Negocio (HU-025)
Como **comprador**, quiero **ver un mapa visual de asientos disponibles** para que **pueda seleccionar asientos específicos antes de pagar** en lugar de solo elegir un nivel de precio.

### Historias de Usuario

#### HU-025.1: Componente Visual de Selección de Asientos

```
Como:        Comprador
Quiero:      Ver un grid visual de asientos disponibles, reservados y vendidos
Para:        Poder elegir qué asiento específico comprar

Prioridad:   Alta
Estimación:  M (13 story points)
Dependencias: SPEC-024 (Backend Asientos - COMPLETADA), HU-001 (Auth)
Capa:        Frontend (React)
```

#### Criterios de Aceptación — HU-025.1

**CA-025.1.1: Visualización de Grid de Asientos (Happy Path)**
```gherkin
CRITERIO-1.1: El mapa de asientos se carga correctamente
  Dado que:  Estoy en la página EventDetail de un evento que tiene asientos configurados
             Y tengo tierId válido (tier con asientos)
  Cuando:    La página carga y hace GET /api/v1/events/{eventId}/seats?tierId={tierId}
  Entonces:  Se muestra:
    - Grid de filas y columnas con asientos
    - Mínimo 20 asientos (5 filas × 4 columnas)
    - Cada asiento muestra: número de fila + número de asiento
    - Color por estado: VERDE (AVAILABLE), GRIS (RESERVED), ROJO (SOLD)
    - Precio del tier debajo del grid
```

**CA-025.1.2: Estado de Asientos Correcto**
```gherkin
CRITERIO-1.2: Los asientos muestran el estado correcto
  Dado que:  El backend retorna lista de asientos con estados AVAILABLE|RESERVED|SOLD
  Cuando:    El SeatMap renderiza los asientos
  Entonces:  
    - AVAILABLE: clickeable (cursor: pointer), fondo verde
    - RESERVED: no clickeable (cursor: not-allowed), fondo gris
    - SOLD: no clickeable (cursor: not-allowed), fondo rojo
    - Al hover en asiento AVAILABLE: se destaca (p.ej. borde más grueso)
```

**CA-025.1.3: Información de Disponibilidad**
```gherkin
CRITERIO-1.3: Se muestra información de capacidad
  Dado que:  El grid está renderizado
  Cuando:    El usuario ve el mapa
  Entonces:  Se muestra:
    - "X asientos disponibles de Y totales" en el encabezado
    - Contador actualizado dinámicamente al seleccionar/deseleccionar
    - Ejemplo: "12 asientos disponibles de 20 totales"
```

---

#### HU-025.2: Selección y Validación de Asientos

```
Como:        Comprador
Quiero:      Poder seleccionar múltiples asientos clickeando
Para:        Asegurar que los asientos quedan marcados visualmente

Prioridad:   Alta
Estimación:  M
Dependencias: HU-025.1
Capa:        Frontend (React)
```

#### Criterios de Aceptación — HU-025.2

**CA-025.2.1: Selección de Múltiples Asientos (Happy Path)**
```gherkin
CRITERIO-2.1: Un comprador puede seleccionar múltiples asientos
  Dado que:  El grid de asientos está visible con estado AVAILABLE
             Y no hay asientos seleccionados actualmente
  Cuando:    Hago clic en asientos disponibles (ej. 3 asientos)
  Entonces:
    - Cada asiento seleccionado cambia a color AZUL
    - Se muestra contador: "3 asientos seleccionados"
    - El subtotal se actualiza: 3 × precio_tier = subtotal
    - Los asientos permanecen seleccionados hasta deseleccionar
```

**CA-025.2.2: Deselección de Asientos**
```gherkin
CRITERIO-2.2: Un comprador puede deseleccionar asientos
  Dado que:  Tengo 3 asientos seleccionados (color AZUL)
  Cuando:    Hago clic nuevamente en uno de los asientos seleccionados
  Entonces:
    - El asiento cambia de vuelta a VERDE (AVAILABLE)
    - Contador actualiza a "2 asientos seleccionados"
    - Subtotal se recalcula: 2 × precio_tier = nuevo_subtotal
```

**CA-025.2.3: Validación de Cantidad (Error Path)**
```gherkin
CRITERIO-2.3: No puedo reservar 0 asientos o superar máximo
  Dado que:  El grid está visible
  Cuando:    Intento proceder sin seleccionar ningún asiento
  Entonces:
    - Botón "Continuar" está deshabilitado / muestra error
    - Mensaje: "Selecciona al menos 1 asiento"
    - HTTP 400 si se intenta vía API
```

**CA-025.2.4: Máximo de Asientos por Compra**
```gherkin
CRITERIO-2.4: Hay límite máximo de asientos seleccionables
  Dado que:  El sistema tiene límite de 100 asientos por compra
  Cuando:    Intento seleccionar más de 100 asientos
  Entonces:
    - El evento se ignora (no se selecciona el asiento 101)
    - Se muestra: "Máximo 100 asientos por compra"
```

---

#### HU-025.3: Fallback a Modalidad de Cuota (Backward Compatibility)

```
Como:        Sistema
Quiero:      Eventos SIN asientos deben seguir funcionando
Para:        Mantener 100% backward compatibility con sistema anterior

Prioridad:   Alta
Estimación:  S
Dependencias: HU-025.1, HU-025.2
Capa:        Frontend
```

#### Criterios de Aceptación — HU-025.3

**CA-025.3.1: Detección de Modo Cuota**
```gherkin
CRITERIO-3.1: El sistema detecta si hay asientos o solo cuota
  Dado que:  Estoy en EventDetail de un evento sin asientos configurados
  Cuando:    La página intenta cargar GET /api/v1/events/{eventId}/seats?tierId={tierId}
  Entonces:
    - Si retorna array vacío O error 404 → modo CUOTA
    - Se oculta SeatMap
    - Se muestra interfaz tradicional: selector de cantidad + precio
```

**CA-025.3.2: Interfaz de Cuota**
```gherkin
CRITERIO-3.2: Modo cuota mantiene comportamiento anterior
  Dado que:  Modo de cuota (sin asientos)
  Cuando:    Veo la pantalla de compra
  Entonces:
    - Se muestra selector: "Cantidad: [1] [2] [3] ..."
    - Precio total = cantidad × precio_tier
    - Flujo de pago igual que antes
    - NO hay SeatMap visible
```

---

#### HU-025.4: Actualización Concurrente de Estado (Optimistic Update)

```
Como:        Comprador
Quiero:      Ver cambios en tiempo real si otros compran asientos
Para:        Evitar sobrevenderse o seleccionar asientos que están siendo vendidos

Prioridad:   Media
Estimación:  M
Dependencias: HU-025.1, HU-025.2
Capa:        Frontend
```

#### Criterios de Aceptación — HU-025.4

**CA-025.4.1: Detección de Cambios Concurrentes (Happy Path)**
```gherkin
CRITERIO-4.1: Asiento vendido por otro comprador es actualizado
  Dado que:  Tengo 3 asientos seleccionados (color AZUL)
             Y otro comprador en otra pestaña pagó exitosamente
  Cuando:    Intento proceder al pago
             Y llamo POST /reservations con mis seatIds
  Entonces:
    - Si uno de mis asientos ahora está SOLD
    - El backend retorna 409 Conflict: "Seat not available"
    - El frontend muestra: "Uno o más asientos no disponibles. Reactualizando..."
    - Se hace GET /api/v1/events/{eventId}/seats nuevamente
    - El grid se actualiza mostrando ROJO para los vendidos
    - Se deshabilita el botón de pago hasta que el usuario re-seleccione
```

**CA-025.4.2: Re-selección Después de Conflicto**
```gherkin
CRITERIO-4.2: El usuario puede re-seleccionar después de conflicto
  Dado que:  Recibí error 409 (asiento no disponible)
             Y vi el grid actualizado
  Cuando:    Selecciono otros asientos disponibles
  Entonces:
    - Los nuevos asientos se seleccionan correctamente (AZUL)
    - El contador y subtotal se actualizan
    - El botón de pago se habilita nuevamente
```

---

### Reglas de Negocio

1. **Selección Mínima:** Se debe seleccionar mínimo 1 asiento para proceder
2. **Selección Máxima:** Máximo 100 asientos por compra
3. **Validación de Estado:** Solo asientos con estado AVAILABLE son clicables
4. **Precio Fijo por Tier:** Todos los asientos de un tier tienen el mismo precio
5. **Backward Compatibility:** Sistema de cuota debe funcionar cuando no hay asientos
6. **Idempotencia de API:** Las llamadas a blockSeats tienen X-Idempotency-Key
7. **Timeout de Bloqueo:** Asientos bloqueados expiran en 10 minutos
8. **Transacción Atómica:** O se bloquean TODOS los asientos o NINGUNO

---

## 2. DISEÑO

### Componentes Frontend

#### SeatMap.tsx
```tsx
// Componente principal
interface SeatMapProps {
  eventId: UUID;
  tierId: UUID;
  tierPrice: number;
  tierType: string;
  onSeatSelectionChange: (selectedSeatIds: UUID[]) => void;
  onError?: (error: string) => void;
}

export function SeatMap(props: SeatMapProps): JSX.Element {
  // Renderiza grid de asientos
  // Maneja selección/deselección
  // Muestra indicadores de disponibilidad
}
```

#### SeatGrid.tsx
```tsx
// Componente de presentación del grid
interface SeatGridProps {
  seats: SeatDTO[];
  selectedSeatIds: UUID[];
  onSeatClick: (seatId: UUID) => void;
}

export function SeatGrid(props: SeatGridProps): JSX.Element {
  // Grid con asientos organizados por fila/columna
}
```

#### SeatItem.tsx
```tsx
// Item individual de asiento
interface SeatItemProps {
  seat: SeatDTO; // { id, row, number, status }
  isSelected: boolean;
  onClick: () => void;
}

export function SeatItem(props: SeatItemProps): JSX.Element {
  // Renderiza un asiento individual con estilos según estado
}
```

#### SeatMapSummary.tsx
```tsx
// Resumen de selección (contador, subtotal, validaciones)
interface SeatMapSummaryProps {
  selectedCount: number;
  totalAvailable: number;
  pricePerSeat: number;
  isLoading: boolean;
  onContinue: () => void;
}

export function SeatMapSummary(props: SeatMapSummaryProps): JSX.Element {
  // Muestra contador, subtotal, botón continuar
}
```

### Archivo de Estilos

#### SeatMap.module.css
```css
/* Classes */
.seatMapContainer { /* max-width, padding, margin */ }
.grid { /* display: grid, grid-template-columns, gap */ }
.seat { /* width, height, cursor, border, transition */ }
.seatAvailable { /* background-color: green */ }
.seatReserved { /* background-color: gray, cursor: not-allowed */ }
.seatSold { /* background-color: red, cursor: not-allowed */ }
.seatSelected { /* background-color: blue, border */ }
.seatHover { /* box-shadow, transform on :hover */ }
.summary { /* display, flex-direction, gap */ }
.error { /* color: red, font-weight */ }
```

### Custom Hooks

#### useSeatSelection.ts
```typescript
interface UseSeatSelectionReturn {
  selectedSeatIds: UUID[];
  toggleSeat: (seatId: UUID) => void;
  clearSelection: () => void;
  isSelected: (seatId: UUID) => boolean;
  getTotalPrice: (pricePerSeat: number) => number;
}

export function useSeatSelection(): UseSeatSelectionReturn {
  // Maneja estado de selección de asientos
  // Valida límites (min 1, max 100)
  // Calcula subtotal
}
```

#### useSeatMapAPI.ts
```typescript
interface UseSeatMapAPIReturn {
  seats: SeatDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSeatMapAPI(eventId: UUID, tierId: UUID): UseSeatMapAPIReturn {
  // GET /api/v1/events/{eventId}/seats?tierId={tierId}
  // Maneja loading, error, retry
  // Prefiere datos en caché si < 30 segundos
}
```

### Servicios / API Layer

#### seatMapService.ts
```typescript
// Funciones sin estado, solo llamadas HTTP

export async function getSeats(
  eventId: UUID,
  tierId: UUID,
  token: string
): Promise<SeatDTO[]> {
  // GET /api/v1/events/{eventId}/seats?tierId={tierId}
}

export async function checkAvailability(
  eventId: UUID,
  seatIds: UUID[],
  token: string
): Promise<SeatAvailabilityResponse> {
  // POST /api/v1/events/{eventId}/seats/availability
  // Body: { seatIds }
}

export async function blockSeats(
  eventId: UUID,
  seatIds: UUID[],
  token: string
): Promise<void> {
  // PATCH /api/v1/events/{eventId}/seats/block
  // Header: X-Idempotency-Key
  // Body: { seatIds }
  // Llamada a ms-events vía API Gateway
}
```

### Integración en EventDetail.tsx

```jsx
// En EventDetail, antes de CartFlow, mostrar SeatMap si hay asientos
function EventDetail() {
  const [selectedSeats, setSelectedSeats] = useState<UUID[]>([]);
  
  // ... código existente ...
  
  return (
    <>
      {/* Mostrar SeatMap si el evento tiene asientos */}
      {eventDetail.hasSeatMap && (
        <SeatMap
          eventId={eventDetail.id}
          tierId={selectedTier.id}
          tierPrice={selectedTier.price}
          onSeatSelectionChange={setSelectedSeats}
        />
      )}
      
      {/* CartFlow recibe selectedSeats */}
      <CartFlow
        eventId={eventDetail.id}
        tierId={selectedTier.id}
        selectedSeats={selectedSeats}
      />
    </>
  );
}
```

### Tipos TypeScript

```typescript
// types/seat.ts

export interface SeatDTO {
  id: UUID;
  row: string;      // "Row-1", "Row-2", etc.
  number: number;   // 1, 2, 3, ...
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
}

export interface SeatAvailabilityResponse {
  available: SeatDTO[];
  unavailable: SeatDTO[];
  timestamp: string; // ISO 8601
}

export interface SeatSelectionState {
  selectedIds: UUID[];
  totalPrice: number;
  isValid: boolean;
}
```

### Variables de Entorno

```env
# .env.local / .env.production
VITE_API_URL=http://localhost:8080  # API Gateway base URL
VITE_SEAT_MAP_MAX_SEATS=100         # Máximo asientos por compra
VITE_SEAT_CACHE_TTL=30000           # Cache TTL en ms
```

### Llamadas HTTP Documentadas

#### GET /api/v1/events/{eventId}/seats?tierId={tierId}
```
Propósito: Obtener mapa de asientos disponibles
Auth: Opcional (public)
Response 200:
[
  {
    "id": "uuid-1",
    "row": "Row-1",
    "number": 1,
    "status": "AVAILABLE"
  },
  ...
]
Error 404: Event o Tier no existe
Error 500: DB error
```

#### POST /api/v1/events/{eventId}/seats/availability
```
Propósito: Validar disponibilidad de asientos específicos
Auth: Opcional
Body: { "seatIds": ["uuid-1", "uuid-2"] }
Response 200:
{
  "available": [...],
  "unavailable": [...],
  "timestamp": "2026-04-02T10:00:00Z"
}
Error 400: seatIds inválido o vacío
```

#### PATCH /api/v1/events/{eventId}/seats/block *(backend - info)*
```
Propósito: Bloquear asientos para reserva (backend)
Auth: No (ms-ticketing internamente)
Headers: X-Idempotency-Key: <UUID>
Body: { "seatIds": [...] }
Response 200: { "status": "BLOCKED", "seatCount": N, ... }
Error 409: Asiento no disponible
```

---

## 3. LISTA DE TAREAS

### Backend (COMPLETADA en FASE 1)
- [x] SeatController con endpoints GET / POST / PATCH
- [x] SeatService con lógica de bloqueo/liberación
- [x] SeatRepository con queries
- [x] Migraciones V10 + V11
- [x] SeatIntegrationService en ms-ticketing
- [x] ReservationService bifurcado (dual-path)

### Frontend (FASE 3 - TODO)

**Sprint 3.1: Componentes Base**
- [ ] Crear SeatMap.tsx con lógica principal
- [ ] Crear SeatGrid.tsx para renderizar grid
- [ ] Crear SeatItem.tsx para cada asiento
- [ ] Crear SeatMapSummary.tsx para resumen
- [ ] Crear SeatMap.module.css con estilos
- [ ] Validar que los estilos NO usan Tailwind (solo CSS Modules)

**Sprint 3.2: Hooks y Servicios**
- [ ] Crear useSeatSelection.ts hook
- [ ] Crear useSeatMapAPI.ts hook
- [ ] Crear seatMapService.ts con llamadas HTTP
- [ ] Integrar con axios/fetch del proyecto
- [ ] Manejo de errores con toasts/notifications

**Sprint 3.3: Integración en EventDetail**
- [ ] Modificar EventDetail.tsx para mostrar SeatMap
- [ ] Pasar eventId, tierId, precio a SeatMap
- [ ] Implementar fallback a cuota si no hay asientos
- [ ] Validar que CartFlow reciba selectedSeats
- [ ] Tests unitarios (80%+ coverage)

**Sprint 3.4: Testing & E2E**
- [ ] Tests: useSeatSelection hook (selección/deselección)
- [ ] Tests: useSeatMapAPI hook (carga datos)
- [ ] Tests: SeatItem renderiza por estado
- [ ] Tests: SeatMapSummary calcula precio correcto
- [ ] E2E: Select seats → Create reservation → Payment
- [ ] E2E: Fallback cuota cuando no hay asientos
- [ ] E2E: Actualización concurrente (otro comprador)

**Sprint 3.5: Polish & Performance**
- [ ] Lazy loading del grid si > 500 asientos
- [ ] Memoización de componentes (React.memo)
- [ ] Caching de GET /seats (30 segundos)
- [ ] Validar accesibilidad (keyboard navigation, ARIA)
- [ ] Validar responsive design (mobile/tablet)

### QA / Testing (Responsabilidad de Test Engineer)
- [ ] Casos Gherkin para CA-025.1 a CA-025.4
- [ ] Test datos concurrentes (race conditions)
- [ ] Test fallback a cuota
- [ ] Test browser compatibility (Chrome, Firefox, Safari)
- [ ] Test performance load (+ de 100 asientos)

### Documentación (Opcional - FASE 5)
- [ ] README: cómo usar SeatMap
- [ ] Storybook: showcase de componentes
- [ ] ADR: decisión de usar CSS Modules vs Tailwind

---

## 4. ACEPTACIÓN Y APROBACIÓN

### DoR Checklist (Definition of Ready)
- [x] Requerimiento completo: Como / Quiero / Para
- [x] Criterios BDD: Happy + Error + Edge cases
- [x] Términos canónicos: "asiento", "tier", "reserva" correctos
- [x] API contrato explícito: endpoints documentados
- [x] Dependencias: SPEC-024 COMPLETADA, Backend listo
- [x] Stack explícito: React 19, TypeScript, Vite, CSS Modules

### Preguntas Abiertas
- **Q1:** ¿Mobile-first o desktop-first en el grid?
  - **R:** Desktop-first; responsive a tablet (grid 3 columnas), mobile (stack vertical)
- **Q2:** ¿Real-time updates (WebSocket)?
  - **R:** MVP no incluye WebSocket; polling en refetch (30s)
- **Q3:** ¿Accequibilidad (WCAG 2.1)?
  - **R:** AA level (keyboard nav, ARIA labels, color contrast)

### Sign-Off Requerido
- [ ] Product Owner: Aprueba HU y criterios
- [ ] Tech Lead: Aprueba diseño frontend + integración
- [ ] QA Lead: Aprueba casos de test

**Status Final:** `DRAFT` → Cambiar a `APPROVED` después de sign-off

---

## 5. REFERENCIAS

- [SPEC-024](/specs/seat-map-backend.spec.md): Backend Asientos (COMPLETADA)
- [HU-025](/requirements/hu-025-seat-map-frontend.md): Requerimiento original
- [Frontend Instructions](/instructions/frontend.instructions.md)
- [Diccionario de Dominio](/copilot-instructions.md#diccionario-de-dominio): términos canónicos
