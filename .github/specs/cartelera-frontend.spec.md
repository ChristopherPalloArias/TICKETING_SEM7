---
id: SPEC-FE-01
status: DRAFT
feature: cartelera-frontend
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: ["SPEC-003", "SPEC-001", "SPEC-002"]
---

# Spec: SPEC-FE-01 — Cartelera Frontend (Vista de Eventos)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Implementación de la vista principal de cartelera en el frontend de SEM7. El comprador explora los eventos publicados, busca por nombre, filtra por tier y fecha, visualiza el estado de disponibilidad de cada evento (DISPONIBLE / AGOTADO) y navega hacia la reserva. La capa de datos es consumida desde `GET /api/v1/events` expuesto por el api-gateway (implementado en HU-03).

### Requerimiento de Negocio
Ver `.github/requirements/cartelera-frontend.md`.

---

### Historias de Usuario

#### HU-FE-01: Vista Cartelera — Listado de eventos con búsqueda

```
Como:        Comprador
Quiero:      Ver la cartelera con todos los eventos publicados y poder buscar por nombre
Para:        Encontrar rápidamente el evento que me interesa y conocer su disponibilidad antes de reservar

Prioridad:   Alta
Estimación:  5 SP
Dependencias: SPEC-003 (HU-03 — GET /api/v1/events)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-FE-01

**CA-01: Carga inicial de la cartelera**
```gherkin
Escenario: Carga inicial exitosa
  Dado que:  El comprador abre la página de cartelera (/eventos)
  Cuando:    La vista termina de cargar los eventos desde GET /api/v1/events
  Entonces:  Se muestra la grilla con todos los eventos publicados
  Y:         Cada tarjeta muestra título, fecha, venue, imagen y badge de estado (DISPONIBLE / AGOTADO)
  Y:         Los eventos con al menos un tier disponible muestran el botón "Reservar" habilitado
  Y:         Los eventos sin ningún tier disponible muestran "Sold Out" deshabilitado
```

**CA-02: Búsqueda en tiempo real por nombre**
```gherkin
Escenario: Filtrado por nombre de evento
  Dado que:  El comprador está en la cartelera con eventos cargados
  Cuando:    Escribe texto en el campo de búsqueda
  Entonces:  La grilla filtra en tiempo real los eventos cuyo título contiene el texto (case-insensitive)
  Y:         Los resultados se actualizan sin necesidad de confirmar la búsqueda
```

**CA-03: Estado vacío — sin resultados de búsqueda**
```gherkin
Escenario: Búsqueda sin coincidencias
  Dado que:  El comprador escribe texto que no coincide con ningún evento
  Cuando:    La lista filtrada queda vacía
  Entonces:  Se muestra el mensaje "No se encontraron eventos que coincidan con tu búsqueda."
  Y:         No se renderiza ninguna tarjeta de evento
```

**CA-04: Indicador de carga**
```gherkin
Escenario: Carga en progreso
  Dado que:  El comprador abre la cartelera
  Cuando:    La petición a la API aún no ha respondido
  Entonces:  Se muestra un indicador de carga visible en pantalla
  Y:         La grilla de eventos no se renderiza hasta que la respuesta sea exitosa
```

**CA-05: Estado de error en la carga**
```gherkin
Escenario: Fallo al obtener eventos
  Dado que:  La petición a GET /api/v1/events devuelve un error (4xx o 5xx)
  Cuando:    El comprador está en la cartelera
  Entonces:  Se muestra un mensaje de error descriptivo
  Y:         La grilla de eventos no se muestra
```

---

#### HU-FE-02: Filtros de tier y fecha en la cartelera

```
Como:        Comprador
Quiero:      Filtrar los eventos por tier (VIP, General, Early Bird) y por fecha
Para:        Acotar la selección según mis preferencias y disponibilidad de tiempo

Prioridad:   Media
Estimación:  3 SP
Dependencias: HU-FE-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-FE-02

**CA-01: Filtro por tier**
```gherkin
Escenario: Filtrado por tipo de tier
  Dado que:  El comprador está en la cartelera con eventos cargados
  Cuando:    Selecciona un tier del dropdown "TIER" (VIP, GENERAL o EARLY_BIRD)
  Entonces:  La grilla muestra solo los eventos que tienen al menos un tier disponible de ese tipo
  Y:         Si ningún evento coincide se muestra el estado vacío
```

**CA-02: Filtro por fecha**
```gherkin
Escenario: Filtrado por rango de fecha
  Dado que:  El comprador está en la cartelera
  Cuando:    Selecciona una opción del dropdown "FECHA" (Esta semana / Este mes / Próximos 3 meses)
  Entonces:  La grilla muestra solo los eventos cuya fecha cae dentro del rango seleccionado
```

**CA-03: Filtros combinados**
```gherkin
Escenario: Búsqueda y filtros activos simultáneamente
  Dado que:  El comprador tiene activo un filtro de tier y texto en el buscador
  Cuando:    La grilla se actualiza
  Entonces:  Solo se muestran los eventos que cumplen todas las condiciones activas simultáneamente
```

**CA-04: Limpiar filtros**
```gherkin
Escenario: Restablecimiento de filtros
  Dado que:  El comprador tiene filtros activos (tier y/o fecha)
  Cuando:    Restablece los dropdowns a su valor por defecto ("TIER" / "FECHA")
  Entonces:  La grilla vuelve a mostrar todos los eventos publicados sin filtrar
```

---

### Reglas de Negocio

1. **Disponibilidad visual**: Un evento se muestra como "DISPONIBLE" si `availableTiers` contiene al menos un tier con `isAvailable: true`. En caso contrario, se muestra como "AGOTADO".
2. **Botón Reservar**: Solo habilitado si el evento tiene `status = DISPONIBLE`. Eventos AGOTADO muestran el botón deshabilitado con texto "Sold Out".
3. **Búsqueda case-insensitive**: El filtrado por nombre ignora mayúsculas/minúsculas y busca coincidencias parciales dentro del título.
4. **Filtrado client-side**: Búsqueda y filtros de tier y fecha se aplican sobre los datos ya descargados sin realizar nuevas peticiones al servidor.
5. **Lectura pública**: El endpoint `GET /api/v1/events` no requiere autenticación; la página es accesible sin login.
6. **Diseño Teatro Noir**: Paleta oscura con acento salmon/naranja. CSS Modules. Sin frameworks CSS externos (sin Tailwind, sin Bootstrap).
7. **Responsive**: Grilla de 1 columna en móvil, 2 en tablet, 3 en desktop. Menú hamburguesa en móvil con animación.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas (solo frontend — sin cambios en BD)

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Event` | API (ms-events) | ninguno | Contrato de respuesta del backend ya definido en HU-03 |
| `Tier` | API (ms-events) | ninguno | Embebido en la respuesta de Event |

#### Tipos TypeScript — interfaces del frontend

```typescript
// src/types/event.types.ts

export type TierType = "VIP" | "GENERAL" | "EARLY_BIRD";
export type TierAvailabilityReason = "SOLD_OUT" | "EXPIRED" | null;
export type EventDisplayStatus = "DISPONIBLE" | "AGOTADO";

export interface TierResponse {
  id: string;
  tierType: TierType;
  price: string;          // BigDecimal serializado como string
  quota: number;
  validFrom: string | null;   // ISO 8601
  validUntil: string | null;  // ISO 8601
  isAvailable: boolean;
  reason: TierAvailabilityReason;
}

export interface RoomResponse {
  id: string;
  name: string;
  maxCapacity: number;
}

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  date: string;           // ISO 8601 — ej. "2026-05-15T19:00:00Z"
  capacity: number;
  room: RoomResponse;
  availableTiers: TierResponse[];
  imageUrl?: string;      // opcional, puede no venir del backend en esta fase
  created_at: string;
}

export interface EventsListResponse {
  total: number;
  events: EventResponse[];
}

// Modelo interno del componente (enriquecido)
export interface EventViewModel extends EventResponse {
  displayStatus: EventDisplayStatus;
  minPrice: number | null;  // precio mínimo entre tiers disponibles
}
```

#### Nota sobre imageUrl
El contrato de HU-03 no incluye campo `imageUrl` en la respuesta del backend. Para la fase inicial, el frontend usará imágenes placeholder o un campo de imagen que deberá ser acordado y añadido al backend en una iteración futura. La lógica de imagen se centralizará en `EventCard` para facilitar el cambio.

---

### API Endpoints consumidos

#### GET /api/v1/events
- **Descripción**: Lista eventos publicados con disponibilidad por tier
- **Auth requerida**: No
- **URL base**: `VITE_API_URL` (variable de entorno)
- **Query parameters opcionales** (para filtros de tier/fecha en fases futuras):
  - `tierType`: `VIP | GENERAL | EARLY_BIRD`
  - `dateFrom`: ISO 8601
  - `dateTo`: ISO 8601
- **Response 200**:
  ```json
  {
    "total": 3,
    "events": [
      {
        "id": "uuid",
        "title": "HAMLET",
        "description": "...",
        "date": "2026-05-15T19:00:00Z",
        "capacity": 500,
        "room": { "id": "uuid", "name": "GLOBE CENTER", "maxCapacity": 500 },
        "availableTiers": [
          {
            "id": "uuid",
            "tierType": "VIP",
            "price": "150.00",
            "quota": 45,
            "validFrom": null,
            "validUntil": null,
            "isAvailable": true,
            "reason": null
          }
        ],
        "created_at": "2026-01-10T10:00:00Z"
      }
    ]
  }
  ```
- **Response 500**: error interno del servidor

---

### Diseño Frontend

#### Paleta de colores (CSS Custom Properties)

```css
/* src/styles/tokens.module.css */
:root {
  --color-surface-lowest:    #0E0E0E;
  --color-surface-low:       #161616;
  --color-surface:           #1C1C1C;
  --color-surface-container: #242424;
  --color-surface-highest:   #323232;
  --color-on-surface:        #E5E2E1;
  --color-on-surface-variant:#B8A9A5;
  --color-primary:           #FF6B47;
  --color-on-primary:        #1C0A04;
  --color-outline-variant:   #3A3A3A;
}
```

#### Componentes nuevos

| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `NavBar` | `components/NavBar/NavBar.tsx` | `activeLink?` | Barra de navegación superior fija con logo, links y menú móvil |
| `MobileMenu` | `components/NavBar/MobileMenu.tsx` | `isOpen, onClose` | Overlay de menú en móvil con animación CSS |
| `FilterBar` | `components/FilterBar/FilterBar.tsx` | `searchQuery, onSearch, tierFilter, onTierChange, dateFilter, onDateChange` | Barra de búsqueda + dropdowns de filtros |
| `FilterDropdown` | `components/FilterBar/FilterDropdown.tsx` | `label, options, value, onChange` | Dropdown estilizado reutilizable |
| `EventCard` | `components/EventCard/EventCard.tsx` | `event: EventViewModel, onReservar` | Tarjeta de evento con imagen, badge, título, metadata y botón |
| `StatusBadge` | `components/EventCard/StatusBadge.tsx` | `status: EventDisplayStatus` | Badge DISPONIBLE / AGOTADO |
| `EventGrid` | `components/EventGrid/EventGrid.tsx` | `events: EventViewModel[], loading, error` | Grilla responsiva con estados de carga/error/vacío |
| `LoadingSkeletons` | `components/EventGrid/LoadingSkeletons.tsx` | `count` | Placeholders de carga para la grilla |
| `EmptyState` | `components/EventGrid/EmptyState.tsx` | `message` | Estado vacío con mensaje |
| `ErrorState` | `components/EventGrid/ErrorState.tsx` | `message` | Estado de error con mensaje |

#### Páginas nuevas

| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `CarteleraPage` | `pages/CarteleraPage/CarteleraPage.tsx` | `/eventos` | No |

#### Hooks y State

| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useEvents` | `hooks/useEvents.ts` | `{ events, loading, error }` | Obtiene eventos desde la API al montar el componente |
| `useEventFilters` | `hooks/useEventFilters.ts` | `{ filteredEvents, searchQuery, setSearchQuery, tierFilter, setTierFilter, dateFilter, setDateFilter }` | Lógica de filtrado combinada sobre la lista de eventos |

#### Services (llamadas API)

| Función | Archivo | Endpoint | Descripción |
|---------|---------|---------|-------------|
| `getEvents()` | `services/eventService.ts` | `GET /api/v1/events` | Lista todos los eventos publicados |

#### Estructura de archivos a crear

```
frontend/src/
  types/
    event.types.ts          ← interfaces TypeScript del dominio
  services/
    eventService.ts         ← cliente HTTP (Axios) → api-gateway
  hooks/
    useEvents.ts            ← fetching + estados loading/error
    useEventFilters.ts      ← lógica de búsqueda y filtros
  components/
    NavBar/
      NavBar.tsx
      NavBar.module.css
      MobileMenu.tsx
      MobileMenu.module.css
    FilterBar/
      FilterBar.tsx
      FilterBar.module.css
      FilterDropdown.tsx
      FilterDropdown.module.css
    EventCard/
      EventCard.tsx
      EventCard.module.css
      StatusBadge.tsx
      StatusBadge.module.css
    EventGrid/
      EventGrid.tsx
      EventGrid.module.css
      LoadingSkeletons.tsx
      EmptyState.tsx
      ErrorState.tsx
  pages/
    CarteleraPage/
      CarteleraPage.tsx
      CarteleraPage.module.css
  styles/
    tokens.module.css       ← custom properties / design tokens
    global.css              ← reset y estilos base
  App.tsx                   ← configurar router y ruta /eventos
```

#### Dependencias nuevas a instalar

| Paquete | Versión | Justificación |
|---------|---------|---------------|
| `react-router-dom` | `^7.x` | Navegación entre páginas (cartelera → detalle de evento) |
| `axios` | `^1.x` | Cliente HTTP hacia api-gateway |

#### Diseño visual — descripción por componente

**NavBar**
- Posición fija en la parte superior (`position: fixed; top: 0`), fondo `--color-surface` con `backdrop-filter: blur`
- Logo "SEM7" a la izquierda (negrita, tracking ajustado)
- Links de navegación: EVENTOS (activo con subrayado acento primario), VENUES, MY TICKETS
- Iconos acción a la derecha: campana de notificaciones (`Bell`), perfil (`User`)
- En móvil: ocultar links, mostrar ícono hamburguesa (`Menu` / `X`)

**MobileMenu**
- Overlay full-screen sobre el contenido
- Animación de entrada: `translateY(-100%)` → `translateY(0)` con `transition: transform 300ms ease`
- Aparece con `z-index` por encima de todo excepto el nav
- Links de navegación en tamaño grande, apilados verticalmente

**FilterBar**
- Input de búsqueda con ícono de lupa a la izquierda
- Fondo `--color-surface-low`, sin borde, `border-radius` generoso
- Dos `FilterDropdown` para TIER y FECHA alineados a la derecha del search
- En móvil: stack vertical (search arriba, dropdowns debajo en fila)

**EventCard**
- Aspecto ratio `3/4` para la imagen (vertical)
- Imagen en escala de grises por defecto; al hover: color y escala leve
- Badge de estado en la esquina superior izquierda
- Título en mayúsculas, negrita, debajo de la imagen
- Metadata: fecha + venue separados por punto "•"
- Botón "Reservar" (fondo `--color-primary`) / "Sold Out" (deshabilitado, fondo `--color-surface-container`)

**EventGrid**
- CSS Grid: `1fr` en móvil, `repeat(2, 1fr)` en tablet, `repeat(3, 1fr)` en desktop
- `gap` generoso entre tarjetas
- Mientras carga: muestra `LoadingSkeletons` (tarjetas fantasma con animación `pulse`)
- Sin resultados: muestra `EmptyState`
- Con error: muestra `ErrorState`

### Arquitectura y Dependencias

- **Backend requerido**: HU-03 implementado y api-gateway enrutando `GET /api/v1/events`
- **Variables de entorno**: `VITE_API_URL` apuntando al api-gateway (`http://localhost:8080` en desarrollo)
- **Sin autenticación requerida**: La cartelera es pública
- **Impacto en App.tsx**: Configurar `<BrowserRouter>` y registrar `<Route path="/eventos">` con `<CarteleraPage />`

### Notas de Implementación

> **CSS Modules obligatorio**: El proyecto prohíbe explícitamente Tailwind y Bootstrap. Todos los estilos van en archivos `.module.css` junto a sus componentes. Los design tokens se definen en `styles/tokens.module.css` como CSS custom properties en `:root`.

> **Filtrado client-side**: Toda la lógica de búsqueda y filtros opera sobre los datos ya cargados en memoria (no se realizan nuevas peticiones al cambiar filtros). Esto es adecuado para el volumen de eventos esperado en esta etapa.

> **Estado de disponibilidad derivado**: El `displayStatus` del `EventViewModel` se calcula en `useEventFilters` a partir de `availableTiers.some(t => t.isAvailable)`. No viene directamente del backend.

> **imageUrl pendiente**: El contrato de HU-03 no incluye imagen. `EventCard` debe aceptar `imageUrl` como prop opcional y mostrar un placeholder si no está disponible. Coordinar con el backend-developer la adición del campo en una iteración posterior.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend

#### Prerequisitos (ya implementados en HU-03 — verificar estado)
- [ ] Confirmar que `GET /api/v1/events` responde en el api-gateway
- [ ] Confirmar que `GET /api/v1/events/{eventId}` responde en el api-gateway
- [ ] Confirmar que CORS está habilitado en api-gateway para `http://localhost:5173`

### Frontend

#### Setup y configuración
- [ ] Instalar dependencias: `npm install react-router-dom axios`
- [ ] Crear `.env` con `VITE_API_URL=http://localhost:8080`
- [ ] Crear `src/styles/tokens.module.css` con CSS custom properties de la paleta Teatro Noir
- [ ] Configurar `BrowserRouter` en `main.tsx` o `App.tsx`
- [ ] Registrar ruta `/eventos` en App.tsx → `<CarteleraPage />`

#### Tipos e interfaces
- [ ] Crear `src/types/event.types.ts` con `TierResponse`, `EventResponse`, `EventsListResponse`, `EventViewModel`

#### Servicios
- [ ] Crear `src/services/eventService.ts` con función `getEvents()` usando Axios
- [ ] Manejar errores HTTP en `eventService.ts` (capturar y relanzar con mensaje legible)

#### Hooks
- [ ] Crear `src/hooks/useEvents.ts` con estados `events`, `loading`, `error` y llamada a `getEvents()` en `useEffect`
- [ ] Crear `src/hooks/useEventFilters.ts` con lógica de filtrado por búsqueda + tier + fecha, y cálculo de `displayStatus`

#### Componentes
- [ ] Crear `NavBar` con logo, links de navegación, iconos y comportamiento responsive
- [ ] Crear `MobileMenu` con overlay animado para móvil
- [ ] Crear `FilterDropdown` reutilizable con opciones, valor actual y callback onChange
- [ ] Crear `FilterBar` integrando input de búsqueda y dos `FilterDropdown` (TIER, FECHA)
- [ ] Crear `StatusBadge` con estilos diferenciados para DISPONIBLE y AGOTADO
- [ ] Crear `EventCard` con imagen (grayscale → color en hover), badge, título, metadata y botón
- [ ] Crear `LoadingSkeletons` con animación pulse para estado de carga
- [ ] Crear `EmptyState` con mensaje configurable
- [ ] Crear `ErrorState` con mensaje configurable
- [ ] Crear `EventGrid` integrando grilla CSS, estados loading/error/vacío y tarjetas de evento

#### Página
- [ ] Crear `CarteleraPage` con sección hero (título "CARTELERA" + descripción), `FilterBar`, `EventGrid` y footer
- [ ] Integrar `useEvents` y `useEventFilters` en `CarteleraPage`
- [ ] Conectar `onReservar` del `EventCard` con la navegación hacia `/eventos/:id` (placeholder por ahora)

#### Responsive y accesibilidad
- [ ] Verificar grilla responsiva: 1 columna (móvil) / 2 columnas (tablet) / 3 columnas (desktop)
- [ ] Verificar menú hamburguesa se abre y cierra en móvil
- [ ] Agregar `aria-label` en botones de ícono (Bell, User, Menu/X)
- [ ] Agregar `alt` descriptivo en imágenes de EventCard
- [ ] Verificar contraste de colores cumple WCAG AA mínimo

### QA

#### HU-FE-01 — Listado y búsqueda
- [ ] Verificar carga inicial muestra todos los eventos del backend (integración real)
- [ ] Verificar búsqueda filtra por nombre (case-insensitive, coincidencia parcial)
- [ ] Verificar mensaje de estado vacío al no encontrar resultados
- [ ] Verificar botón "Reservar" habilitado para eventos DISPONIBLE
- [ ] Verificar botón "Sold Out" deshabilitado para eventos AGOTADO
- [ ] Verificar indicador de carga durante la petición al API
- [ ] Verificar mensaje de error al simular fallo del API (mock 500)

#### HU-FE-02 — Filtros
- [ ] Verificar dropdown TIER filtra por VIP / GENERAL / EARLY_BIRD
- [ ] Verificar dropdown FECHA filtra por "Esta semana" / "Este mes" / "Próximos 3 meses"
- [ ] Verificar combinación búsqueda + tier + fecha funciona simultáneamente
- [ ] Verificar que limpiar filtros restaura lista completa

#### Responsive y visual
- [ ] Verificar layout en 375px (móvil iPhone SE)
- [ ] Verificar layout en 768px (tablet)
- [ ] Verificar layout en 1280px (desktop)
- [ ] Verificar menú hamburguesa en móvil
- [ ] Verificar efecto hover (grayscale → color) en imágenes de EventCard
- [ ] Verificar badge DISPONIBLE con fondo acento primario
- [ ] Verificar badge AGOTADO con fondo gris oscuro
- [ ] Verificar animación de entrada del MobileMenu
