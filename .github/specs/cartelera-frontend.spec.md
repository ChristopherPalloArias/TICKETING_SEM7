---
id: SPEC-008
status: APPROVED
feature: cartelera-frontend
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: ["hu-03"]
---

# Spec: Cartelera — Vista de Eventos (Frontend)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Implementación de la vista principal de cartelera en el frontend de SEM7. El comprador accede a la página `/eventos` para explorar los eventos publicados, filtrar por nombre/tier/fecha, navegar con paginación progresiva y acceder al flujo de reserva. El backend (ms-events, HU-03) ya expone `GET /api/v1/events`; este feature cubre exclusivamente la capa de presentación (React + TypeScript + CSS Modules).

**Capa afectada:** `frontend/`  
**Depende de:** HU-03 (ms-events — listado de eventos)  
**Stack:** React 19 · TypeScript 5 · CSS Modules · Vite · Axios · React Router v7 · Framer Motion · lucide-react

---

### Historias de Usuario

#### HU-FE-01: Vista Cartelera — Listado de eventos con búsqueda

```
Como:        Comprador
Quiero:      Ver la cartelera con todos los eventos publicados y poder buscar por nombre
Para:        Encontrar rápidamente el evento de interés y conocer su disponibilidad antes de reservar

Prioridad:   Alta
Estimación:  5 SP
Dependencias: HU-03
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-01

**CA-FE01-01. Carga inicial de la cartelera**
```gherkin
Escenario: Cartelera carga y muestra eventos publicados
  Dado que el comprador abre la página /eventos
  Cuando la vista termina de cargar
  Entonces se muestra la grilla con todos los eventos publicados obtenidos de GET /api/v1/events
  Y cada tarjeta muestra el título, fecha, venue, imagen y badge de estado (DISPONIBLE / AGOTADO)
  Y los eventos con status DISPONIBLE muestran el botón "Reservar" habilitado
  Y los eventos con status AGOTADO muestran "Sold Out" deshabilitado
```

**CA-FE01-02. Búsqueda en tiempo real por nombre**
```gherkin
Escenario: Filtrado por nombre
  Dado que el comprador está en la cartelera con eventos cargados
  Cuando escribe texto en el campo de búsqueda
  Entonces la grilla filtra en tiempo real mostrando solo los eventos cuyo título contiene el texto (case-insensitive)
  Y si ningún evento coincide se muestra el mensaje "No se encontraron eventos que coincidan con tu búsqueda."
```

**CA-FE01-03. Estado vacío por búsqueda sin resultados**
```gherkin
Escenario: Búsqueda sin resultados
  Dado que el comprador escribe un texto que no coincide con ningún evento
  Cuando la lista filtrada queda vacía
  Entonces se muestra un componente EmptyState centrado en la página
  Y no se muestra ninguna tarjeta de evento
```

**CA-FE01-04. Indicador de carga durante la petición**
```gherkin
Escenario: Indicador de carga
  Dado que el comprador abre la cartelera
  Cuando la petición a la API aún no ha respondido
  Entonces se muestran skeleton cards visibles en pantalla
  Y la grilla de eventos reales no se renderiza hasta que la respuesta sea exitosa
```

**CA-FE01-05. Estado de error al fallar la carga**
```gherkin
Escenario: Error en la carga de eventos
  Dado que la petición a GET /api/v1/events devuelve un error (4xx o 5xx)
  Cuando el comprador está en la cartelera
  Entonces se muestra un componente ErrorState con mensaje descriptivo
  Y la grilla de eventos no se muestra
```

---

#### HU-FE-02: Filtros de tier y fecha en la cartelera

```
Como:        Comprador
Quiero:      Filtrar los eventos de la cartelera por tier (VIP, General, Early Bird) y por fecha
Para:        Acotar la selección según preferencias económicas y disponibilidad de tiempo

Prioridad:   Media
Estimación:  3 SP
Dependencias: HU-FE-01
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-02

**CA-FE02-01. Filtro por tier**
```gherkin
Escenario: Filtrado por tier
  Dado que el comprador está en la cartelera con eventos cargados
  Cuando selecciona un tier del dropdown "TIER" (VIP, GENERAL o EARLY_BIRD)
  Entonces la grilla muestra solo los eventos que tienen ese tier disponible
  Y si ningún evento coincide se muestra el estado vacío
```

**CA-FE02-02. Filtro por fecha**
```gherkin
Escenario: Filtrado por rango de fecha
  Dado que el comprador está en la cartelera
  Cuando selecciona una opción del dropdown "FECHA" (Esta semana, Este mes, Próximos 3 meses)
  Entonces la grilla muestra solo los eventos cuya fecha cae dentro del rango seleccionado
```

**CA-FE02-03. Combinación de filtros**
```gherkin
Escenario: Filtros combinados con búsqueda
  Dado que el comprador tiene activo un filtro de tier y ha escrito texto en el buscador
  Cuando la grilla se actualiza
  Entonces solo se muestran los eventos que cumplen todas las condiciones simultáneamente (búsqueda AND tier AND fecha)
```

**CA-FE02-04. Limpiar filtros**
```gherkin
Escenario: Restablecer filtros
  Dado que el comprador tiene varios filtros activos
  Cuando restablece los filtros a su valor por defecto ("all" y "all")
  Entonces la grilla vuelve a mostrar todos los eventos publicados sin filtrar
```

---

#### HU-FE-03: Grilla bento con jerarquía visual de tarjetas

```
Como:        Comprador
Quiero:      Ver la cartelera organizada en una grilla bento con tarjeta destacada, secundaria y regulares
Para:        Percibir de forma inmediata qué evento es el principal y explorar el resto con lectura visual natural

Prioridad:   Alta
Estimación:  3 SP
Dependencias: HU-FE-01
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-03

**CA-FE03-01. Tarjeta destacada con layout hero**
```gherkin
Escenario: Renderizado de tarjeta featured
  Dado que el comprador carga la cartelera con al menos un evento publicado
  Cuando la grilla bento se renderiza
  Entonces el primer evento ocupa la posición hero (8 columnas en desktop, col-span-8)
  Y la tarjeta muestra imagen a pantalla completa con gradiente from-surface
  Y se muestran: badge de tag (si existe), fecha, título en tipografía grande, venue con ícono MapPin y precio con label "Starting from"
  Y al hacer hover la tarjeta escala sutilmente (scale 1.02) y la imagen hace zoom
```

**CA-FE03-02. Tarjeta secundaria tall ocupa columna lateral**
```gherkin
Escenario: Renderizado de tarjeta tall
  Dado que la grilla bento está visible con al menos dos eventos
  Cuando se renderiza el segundo evento
  Entonces ocupa 4 columnas en desktop con la misma altura que la featured (h-[500px])
  Y muestra fecha, título, venue con ícono MapPin y precio sobre el gradiente de la imagen
```

**CA-FE03-03. Tarjetas regulares con efecto escala de grises**
```gherkin
Escenario: Efecto hover en tarjetas regulares
  Dado que la cartelera muestra tres o más eventos adicionales en formato regular
  Cuando el comprador posiciona el cursor sobre una tarjeta regular (índice >= 2)
  Entonces la imagen transiciona de escala de grises a color completo en 700ms
  Y la tarjeta escala ligeramente (scale 1.02)
  Y si el evento tiene campo tag se muestra su badge en color primary sobre la tarjeta
```

**CA-FE03-04. Layout responsivo de la grilla bento**
```gherkin
Escenario: Adaptación de la grilla en mobile
  Dado que el comprador accede desde un dispositivo móvil (< 768px)
  Cuando la cartelera se renderiza
  Entonces todas las tarjetas se apilan en una sola columna (col-span-12 o col-span-full)
  Y se mantiene el orden: featured → tall → regulares
```

**CA-FE03-05. Animación de entrada escalonada**
```gherkin
Escenario: Tarjetas aparecen de forma secuencial al montar la vista
  Dado que el comprador abre la cartelera por primera vez
  Cuando la grilla de eventos se monta
  Entonces cada tarjeta aparece con animación fade-in + scale (0.95 → 1)
  Y las tarjetas aparecen de forma escalonada con delay = index * 0.1s
  Y la animación se ejecuta una sola vez al montar (no en re-renders)
```

---

#### HU-FE-04: Etiquetas y badges de estado en tarjetas de evento

```
Como:        Comprador
Quiero:      Ver etiquetas visuales en las tarjetas de evento (ej. "FEATURED PERFORMANCE", "LIMITED SEATING")
Para:        Identificar de inmediato los eventos con características especiales sin abrir el detalle

Prioridad:   Media
Estimación:  1 SP
Dependencias: HU-FE-03
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-04

**CA-FE04-01. Badge filled para etiqueta destacada**
```gherkin
Escenario: Evento con tag = "FEATURED PERFORMANCE"
  Dado que el backend devuelve el primer evento con campo tag = "FEATURED PERFORMANCE"
  Cuando la tarjeta featured se renderiza
  Entonces se muestra un badge con fondo primary y texto surface en mayúsculas
  Y el badge se posiciona en la sección inferior izquierda de la tarjeta, junto a la fecha
```

**CA-FE04-02. Badge outlined para etiquetas de eventos regulares**
```gherkin
Escenario: Evento con tag diferente a FEATURED PERFORMANCE
  Dado que un evento tiene campo tag = "LIMITED SEATING"
  Cuando la tarjeta regular se renderiza
  Entonces se muestra el tag como badge con borde primary/30 y texto primary en uppercase (sin fondo relleno)
  Y el badge se posiciona encima del título en la sección inferior de la tarjeta
```

**CA-FE04-03. Eventos sin etiqueta no muestran badge**
```gherkin
Escenario: Evento sin tag
  Dado que el backend devuelve un evento sin campo tag (null o vacío)
  Cuando la tarjeta se renderiza
  Entonces no se muestra ningún badge ni espacio reservado para el tag
```

**CA-FE04-04. Badge isLimited para aforo reducido**
```gherkin
Escenario: Evento con isLimited = true
  Dado que el backend devuelve un evento con campo isLimited = true
  Cuando la tarjeta del evento se renderiza
  Entonces se muestra un badge "Limited Seating" con fondo surface-high y texto on-surface
  Y el badge es independiente del campo tag (pueden coexistir)
  Y si isLimited = false o es null el badge no se muestra
```

---

#### HU-FE-05: Acciones de navegación — notificaciones, carrito y perfil

```
Como:        Comprador autenticado
Quiero:      Ver accesos rápidos a notificaciones, carrito y perfil en la barra de navegación
Para:        Gestionar tickets y alertas sin salir de la cartelera

Prioridad:   Media
Estimación:  2 SP
Dependencias: HU-FE-01
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-05

**CA-FE05-01. Ícono Bell en navbar**
```gherkin
Escenario: Ícono de notificaciones visible
  Dado que el comprador está en cualquier página con navbar
  Cuando la navbar se renderiza en modo estándar
  Entonces se muestra el ícono Bell (lucide-react) en el área de acciones del navbar
  Y al hacer hover el ícono transiciona a color primary
```

**CA-FE05-02. Ícono ShoppingCart en navbar**
```gherkin
Escenario: Ícono de carrito visible
  Dado que el comprador está en cualquier página con navbar
  Cuando la navbar se renderiza en modo estándar
  Entonces se muestra el ícono ShoppingCart en el área de acciones del navbar
  Y al hacer hover el ícono transiciona a color primary
```

**CA-FE05-03. Avatar de perfil en navbar**
```gherkin
Escenario: Avatar del usuario visible
  Dado que la navbar se renderiza
  Cuando el componente se monta
  Entonces se muestra un avatar circular (32x32px) con imagen de perfil del usuario
  Y si la imagen no carga se mantiene el contenedor con borde visible (fallback)
```

**CA-FE05-04. Navbar reducida en modo transaccional**
```gherkin
Escenario: Navbar oculta acciones en checkout y pago
  Dado que el comprador entra a una pantalla de checkout, pago, éxito o fallo
  Cuando el navbar se renderiza con prop isTransactional = true
  Entonces los íconos Bell, ShoppingCart y el avatar NO se muestran
  Y los links de navegación (Events, Venues, My Tickets) NO se muestran
```

---

#### HU-FE-06: Navegación inferior en dispositivos móviles

```
Como:        Comprador en dispositivo móvil
Quiero:      Ver una barra de navegación inferior fija con accesos a las secciones principales
Para:        Navegar entre Explorar, Venues y Mis Tickets con una sola mano

Prioridad:   Alta
Estimación:  2 SP
Dependencias: HU-FE-01
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-06

**CA-FE06-01. Bottom nav visible solo en mobile**
```gherkin
Escenario: Bottom nav en viewport móvil (< 768px)
  Dado que el comprador accede desde un dispositivo con pantalla menor a 768px
  Cuando cualquier página con navegación se renderiza
  Entonces se muestra una barra fija en la parte inferior con tres ítems: Explore, Venues, Tickets
  Y la barra tiene fondo con backdrop-blur y borde superior sutil
```

**CA-FE06-02. Bottom nav oculto en desktop**
```gherkin
Escenario: Bottom nav en viewport desktop (>= 768px)
  Dado que el comprador accede desde un dispositivo con pantalla >= 768px
  Cuando la página se renderiza
  Entonces la barra inferior NOT es visible (hidden en md+)
  Y la navbar superior es la única visible
```

**CA-FE06-03. Estado activo en ítem seleccionado**
```gherkin
Escenario: Indicador de sección activa en bottom nav
  Dado que el comprador está navegando en la sección "Explore"
  Cuando la barra inferior se renderiza
  Entonces el ícono y label de "Explore" se muestran en color primary
  Y los demás ítems (Venues, Tickets) se muestran en color on-surface-variant
```

---

#### HU-FE-07: Paginación con botón "Load More" en la cartelera

```
Como:        Comprador
Quiero:      Cargar más eventos desde la cartelera haciendo clic en "Load More"
Para:        Explorar el catálogo completo de forma progresiva sin sobrecargar la carga inicial

Prioridad:   Media
Estimación:  2 SP
Dependencias: HU-FE-01, HU-03 (soporte paginación en backend)
Capa:        Frontend (con contrato de paginación al backend)
```

##### Criterios de Aceptación — HU-FE-07

**CA-FE07-01. Botón Load More visible cuando hay más eventos**
```gherkin
Escenario: Más eventos disponibles en el servidor
  Dado que la cartelera carga una página inicial de eventos
  Cuando el servidor indica que existen más eventos (respuesta con paginación)
  Entonces se muestra el botón "Load More Performances" centrado debajo de la grilla
  Y el botón tiene estilos primarios con animación de hover (scale 1.05) y tap (scale 0.95)
```

**CA-FE07-02. Carga incremental al hacer clic**
```gherkin
Escenario: Clic en Load More
  Dado que el comprador ve el botón "Load More Performances"
  Cuando hace clic en él
  Entonces se realiza una petición a GET /api/v1/events con el siguiente parámetro de página
  Y los nuevos eventos se agregan a la grilla existente (sin reemplazar los actuales)
  Y el botón muestra estado de carga (spinner o texto "Loading...") mientras la petición está en vuelo
```

**CA-FE07-03. Botón oculto cuando no hay más eventos**
```gherkin
Escenario: Todos los eventos fueron cargados
  Dado que la respuesta del servidor indica que no hay más páginas (hasMore = false)
  Cuando la grilla se actualiza con la última página
  Entonces el botón "Load More Performances" desaparece
```

---

### Reglas de Negocio

1. **Disponibilidad de tier:** Un evento se muestra como DISPONIBLE si al menos uno de sus `availableTiers` tiene `isAvailable = true`. Si todos los tiers están no disponibles → AGOTADO.
2. **Precio mínimo:** `minPrice` se calcula como el menor `price` entre los tiers con `isAvailable = true`. Si no hay tiers disponibles → `null`.
3. **Badge de tag:** El estilo varía según el valor del campo `tag`: `FEATURED PERFORMANCE` → filled (fondo primary); cualquier otro valor → outlined (borde + texto primary).
4. **isLimited e independencia de tag:** `isLimited` es un boolean independiente del campo `tag`. Ambos badges pueden coexistir en la misma tarjeta.
5. **Filtros combinados:** Los filtros de búsqueda, tier y fecha se aplican con lógica AND sobre la lista local de eventos.
6. **Paginación:** Al llamar Load More, los nuevos eventos se agregan al final del array existente; no se reinicia la lista. Un error en Load More no limpia los eventos ya cargados.
7. **Navbar transaccional:** En las rutas de checkout/pago/éxito/fallo, el navbar se muestra en modo reducido: sin Bell, ShoppingCart, avatar ni links de navegación.
8. **Animaciones Framer Motion:** Las animaciones de entrada son `mount-only` (no se repiten en re-renders filtrados).

---

## 2. DISEÑO

### Modelos de Datos

> Esta spec no introduce cambios en la base de datos del backend. Los cambios son solo en el tipo frontend `EventResponse` para сoportar campos opcionales.

#### Campos nuevos en EventResponse (frontend)

| Campo | Tipo TS | Obligatorio | Descripción |
|-------|---------|-------------|-------------|
| `tag` | `string \| undefined` | No | Etiqueta editorial del evento (ej. "FEATURED PERFORMANCE", "LIMITED SEATING") |
| `isLimited` | `boolean \| undefined` | No | Indica aforo reducido; badge independiente del campo `tag` |

#### Campos nuevos en EventsListResponse (frontend — paginación HU-FE-07)

| Campo | Tipo TS | Obligatorio | Descripción |
|-------|---------|-------------|-------------|
| `total` | `number` | Sí | Total de eventos en el servidor (ya existe) |
| `page` | `number` | Sí | Página actual devuelta por el backend |
| `pageSize` | `number` | Sí | Cantidad de eventos por página |
| `hasMore` | `boolean` | Sí | Indica si existen más páginas por cargar |

#### Interfaces TypeScript actualizadas

```typescript
// types/event.types.ts — extensiones

interface EventResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  room: RoomResponse;
  availableTiers: TierResponse[];
  imageUrl?: string;
  created_at: string;
  // Campos nuevos (HU-FE-04)
  tag?: string;
  isLimited?: boolean;
}

interface EventsListResponse {
  total: number;
  events: EventResponse[];
  // Campos nuevos para paginación (HU-FE-07)
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface EventViewModel extends EventResponse {
  displayStatus: EventDisplayStatus;
  minPrice: number | null;
}
```

---

### API Endpoints

> Esta spec no crea nuevos endpoints. El frontend consume el endpoint ya existente en ms-events (HU-03).

#### GET /api/v1/events

- **Descripción:** Lista eventos publicados con soporte de paginación
- **Auth requerida:** No (acceso público para comprador)
- **Query Params nuevos (HU-FE-07):**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Número de página (base 1) |
| `pageSize` | integer | 10 | Eventos por página |

- **Response 200 actualizado:**
  ```json
  {
    "total": 42,
    "page": 1,
    "pageSize": 10,
    "hasMore": true,
    "events": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "date": "2026-05-15T20:00:00Z",
        "capacity": 500,
        "tag": "FEATURED PERFORMANCE",
        "isLimited": false,
        "imageUrl": "https://...",
        "room": { "id": "uuid", "name": "Sala Principal", "maxCapacity": 500 },
        "availableTiers": [
          {
            "id": "uuid",
            "tierType": "VIP",
            "price": "150.00",
            "quota": 50,
            "isAvailable": true,
            "reason": null
          }
        ],
        "created_at": "2026-03-01T10:00:00Z"
      }
    ]
  }
  ```
- **Response 400:** parámetro de página inválido (page < 1 o pageSize fuera de rango)
- **Response 500:** error inesperado en el servidor

> **Nota:** Los campos `tag`, `isLimited`, `page`, `pageSize` y `hasMore` requieren ser agregados al endpoint de ms-events (HU-03). Si el backend no los soporta aún, se implementa paginación client-side y los campos `tag`/`isLimited` se omiten de forma defensiva en el frontend.

---

### Diseño Frontend

#### Componentes existentes (a modificar)

| Componente | Archivo | Cambios necesarios |
|------------|---------|-------------------|
| `EventCard` | `components/EventCard/EventCard.tsx` | Agregar soporte de layout bento (`isFeatured`, `isTall`), badges `tag`/`isLimited`, animaciones Framer Motion |
| `NavBar` | `components/NavBar/NavBar.tsx` | Agregar íconos `Bell`, `ShoppingCart`, avatar de perfil; soporte para prop `isTransactional` |
| `EventGrid` | `components/EventGrid/EventGrid.tsx` | Refactorizar a grilla bento (CSS grid 12 cols), agregar botón "Load More" |
| `useEvents` | `hooks/useEvents.ts` | Agregar estado `page`, función `loadMore`, flag `hasMore` |
| `eventService` | `services/eventService.ts` | Aceptar parámetro `page` en `getEvents(params)` |
| `event.types.ts` | `types/event.types.ts` | Agregar campos `tag`, `isLimited` en `EventResponse`; campos de paginación en `EventsListResponse` |

#### Componentes nuevos

| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `BottomNav` | `components/NavBar/BottomNav.tsx` | `activeLink?: 'eventos' \| 'venues' \| 'tickets'` | Barra de navegación inferior fija para mobile. Oculta en md+. Ítems: Explore (Search), Venues (MapPin), Tickets (Ticket) con estado activo via `useLocation` |
| `EventTagBadge` | `components/EventCard/EventTagBadge.tsx` | `tag: string`, `variant: 'filled' \| 'outlined'` | Badge de etiqueta de evento. `filled` para FEATURED PERFORMANCE; `outlined` para otros |
| `LoadMoreButton` | `components/EventGrid/LoadMoreButton.tsx` | `onClick: () => void`, `loading: boolean` | Botón "Load More Performances" centrado con animación Framer Motion |

#### Páginas (sin cambios estructurales)

| Página | Archivo | Ruta | Cambios |
|--------|---------|------|---------|
| `CarteleraPage` | `pages/CarteleraPage/CarteleraPage.tsx` | `/eventos` | Pasar `isTransactional=false` a NavBar; renderizar `BottomNav`; conectar `loadMore` del hook al `LoadMoreButton` |

#### Hooks y State

| Hook | Archivo | Estado nuevo | Funciones nuevas |
|------|---------|-------------|-----------------|
| `useEvents` | `hooks/useEvents.ts` | `page: number`, `hasMore: boolean`, `loadingMore: boolean` | `loadMore(): void` — carga la siguiente página y acumula resultados |

#### Services

| Función | Archivo | Endpoint | Nuevo parámetro |
|---------|---------|---------|----------------|
| `getEvents(params?)` | `services/eventService.ts` | `GET /api/v1/events` | `params?: { page?: number; pageSize?: number }` |

#### Tokens de diseño (Teatro Noir — sin cambios)

Los tokens ya definidos en `styles/tokens.module.css` son suficientes para todas las HUs. No se requieren tokens nuevos. Referencia:

| Token | Valor | Uso en este feature |
|-------|-------|---------------------|
| `--color-primary` | `#FF6B47` | Badges filled, íconos hover, estado activo BottomNav |
| `--color-surface` | `#1C1C1C` | Fondo de tarjetas y gradientes |
| `--color-on-surface` | `#E5E2E1` | Texto principal en tarjetas |
| `--color-on-surface-variant` | `#B8A9A5` | Ítems inactivos en BottomNav, metadata de tarjeta |
| `--color-surface-container` | `#242424` | Fondo de BottomNav |
| `--color-outline-variant` | `#3A3A3A` | Borde superior de BottomNav, bordes outlined badge |

#### Arquitectura y Dependencias

- **Paquetes nuevos requeridos:**
  - `framer-motion` — animaciones de entrada escalonada y hover en EventCard (HU-FE-03)
  - `lucide-react` — íconos Bell, ShoppingCart, MapPin, Search, Ticket, ChevronDown (ya puede estar instalado)
- **Impacto en App.tsx:** No requiere nuevas rutas; `BottomNav` se renderiza dentro de `CarteleraPage` o en un layout compartido.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Frontend

#### Tipos y contratos
- [ ] Agregar campos `tag?: string` e `isLimited?: boolean` en interfaz `EventResponse` (`types/event.types.ts`)
- [ ] Agregar campos `page`, `pageSize`, `hasMore` en interfaz `EventsListResponse` (`types/event.types.ts`)
- [ ] Verificar que `EventViewModel` extienda los campos nuevos sin duplicarlos

#### Services
- [ ] Actualizar `getEvents(params?)` en `services/eventService.ts` para aceptar y enviar `page` y `pageSize` como query params

#### Hooks
- [ ] Agregar estado `page`, `hasMore`, `loadingMore` en `useEvents.ts`
- [ ] Implementar función `loadMore()` en `useEvents.ts` que incrementa `page` y acumula resultados sin reemplazar los existentes
- [ ] Manejar error en `loadMore` sin limpiar el array de eventos ya cargados

#### Componente EventCard (refactor + nuevas features)
- [ ] Agregar prop `variant: 'featured' | 'tall' | 'regular'` (o `isFeatured?: boolean`) en `EventCard.tsx`
- [ ] Implementar layout hero (8 col) para `featured` con imagen full, gradiente y metadatos superpuestos
- [ ] Implementar layout tall (4 col, h-[500px]) para el segundo evento
- [ ] Implementar layout regular (4 col, h-[400px]) para eventos desde índice 2, con filtro grayscale → color en hover
- [ ] Integrar `motion.div` de Framer Motion con `initial={{ opacity: 0, scale: 0.95 }}`, `animate={{ opacity: 1, scale: 1 }}`, `transition={{ delay: index * 0.1 }}`
- [ ] Integrar `whileHover={{ scale: 1.02 }}` en todas las variantes de tarjeta
- [ ] Actualizar `EventCard.module.css` con estilos bento, gradientes y transición grayscale

#### Componente EventTagBadge (nuevo)
- [ ] Crear `components/EventCard/EventTagBadge.tsx` con prop `tag: string` y `variant: 'filled' | 'outlined'`
- [ ] Estilo `filled`: fondo `--color-primary`, texto `--color-surface`, texto en mayúsculas
- [ ] Estilo `outlined`: borde `rgba(--color-primary, 0.3)`, texto `--color-primary`, texto en mayúsculas, sin relleno
- [ ] Renderizar `EventTagBadge` condicionalmente en `EventCard` cuando `tag` tiene valor
- [ ] Renderizar badge "Limited Seating" condicionalmente cuando `isLimited === true` (estilos: fondo `--color-surface-container`, texto `--color-on-surface`)
- [ ] Crear `EventTagBadge.module.css`

#### Componente EventGrid (refactor bento + Load More)
- [ ] Refactorizar `EventGrid.tsx` a grid de 12 columnas para soporte bento
- [ ] Renderizar el primer evento con `variant="featured"` (col-span-8), segundo con `variant="tall"` (col-span-4), resto con `variant="regular"` (col-span-4 o col-span-6)
- [ ] Pasar `index` a cada `EventCard` para el delay de animación Framer Motion
- [ ] Crear componente `LoadMoreButton.tsx` con prop `onClick`, `loading` y animación Framer Motion (hover scale 1.05, tap scale 0.95)
- [ ] Renderizar `LoadMoreButton` condicionalmente según `hasMore`
- [ ] Actualizar `EventGrid.module.css` para la grilla bento responsiva

#### Componente NavBar (extensión acciones + BottomNav)
- [ ] Agregar íconos `Bell` y `ShoppingCart` (lucide-react) como elementos `<button>` en `NavBar.tsx`
- [ ] Aplicar `hover:text-primary transition-colors` en botones Bell y ShoppingCart
- [ ] Agregar avatar circular con `<img>` protegido con `referrerPolicy="no-referrer"` y fallback visual
- [ ] Agregar prop `isTransactional?: boolean` en `NavBar.tsx` para ocultar acciones (Bell, ShoppingCart, avatar, links) en modo transaccional
- [ ] Crear `components/NavBar/BottomNav.tsx` con 3 ítems (Explore/Search, Venues/MapPin, Tickets/Ticket) y estado activo via `useLocation`
- [ ] Renderizar `BottomNav` con `display: block md:hidden` (visible solo en mobile)
- [ ] Implementar lógica de estado activo en BottomNav basada en ruta actual
- [ ] Agregar padding inferior en el layout de `CarteleraPage` para evitar que BottomNav tape contenido
- [ ] Actualizar `NavBar.module.css` y crear `BottomNav.module.css`

#### Página CarteleraPage
- [ ] Conectar función `loadMore` de `useEvents` al componente `LoadMoreButton`
- [ ] Pasar `isTransactional={false}` a NavBar
- [ ] Incluir `BottomNav` con `activeLink="eventos"` en el layout de la página

#### Configuración
- [ ] Verificar que `VITE_API_URL` está configurada en `.env` y `.env.example`
- [ ] Instalar `framer-motion` si no está ya en `package.json`

---

### QA

#### HU-FE-01 — Listado y búsqueda
- [ ] Verificar carga inicial muestra todos los eventos publicados del backend
- [ ] Verificar búsqueda filtra correctamente (case-insensitive, parcial)
- [ ] Verificar mensaje de estado vacío al no encontrar resultados
- [ ] Verificar botón "Reservar" deshabilitado para eventos AGOTADO
- [ ] Verificar indicador de carga (skeletons) mientras la petición está en vuelo
- [ ] Verificar mensaje de error al simular fallo del API (4xx/5xx)

#### HU-FE-02 — Filtros
- [ ] Verificar filtro TIER muestra solo eventos con ese tier disponible
- [ ] Verificar filtro FECHA acota resultados al rango correcto
- [ ] Verificar combinación búsqueda + tier + fecha funciona simultáneamente
- [ ] Verificar que limpiar filtros restaura la lista completa
- [ ] Verificar que el ícono ChevronDown se muestra en dropdown de TIER

#### HU-FE-03 — Grilla Bento
- [ ] Verificar orden y proporciones de la grilla en desktop (1200px+): 8-col + 4-col + regulares
- [ ] Verificar colapso a 1 columna en mobile (< 768px)
- [ ] Verificar que la animación de entrada escalonada ocurre al montar la vista por primera vez
- [ ] Verificar que el delay se incrementa visiblemente entre tarjetas contiguas
- [ ] Verificar efecto grayscale → color en tarjetas regulares al hacer hover
- [ ] Verificar hover scale no genera scroll horizontal inesperado

#### HU-FE-04 — Badges
- [ ] Verificar badge filled (fondo primary) para tag = "FEATURED PERFORMANCE"
- [ ] Verificar badge outlined (borde primary) para otros valores de tag
- [ ] Verificar que no aparece badge cuando tag es null o vacío
- [ ] Verificar badge "Limited Seating" aparece solo cuando isLimited = true
- [ ] Verificar que ambos badges (tag + isLimited) pueden coexistir en la misma tarjeta

#### HU-FE-05 — Acciones navbar
- [ ] Verificar íconos Bell y ShoppingCart visibles en navbar en modo estándar
- [ ] Verificar efecto hover color primary en Bell y ShoppingCart
- [ ] Verificar que los botones son focusables y activables por teclado (accesibilidad)
- [ ] Verificar avatar renderizado sin error de consola (referrerPolicy="no-referrer")
- [ ] Verificar que Bell, ShoppingCart y avatar NO aparecen en modo transaccional

#### HU-FE-06 — Bottom navigation
- [ ] Verificar que la bottom nav NO aparece en desktop (>= 768px)
- [ ] Verificar que sí aparece y es fija en mobile (< 768px)
- [ ] Verificar indicador de ítem activo cambia al navegar entre secciones
- [ ] Verificar que bottom nav no tapa contenido inferior de la página (padding-bottom en main)

#### HU-FE-07 — Load More
- [ ] Verificar que los eventos nuevos se agregan sin reemplazar los anteriores
- [ ] Verificar que el botón desaparece cuando hasMore = false
- [ ] Verificar que el botón muestra estado loading mientras la petición está en vuelo
- [ ] Verificar que un error en Load More no limpia los eventos ya cargados

#### General
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CA-FE01-01 a CA-FE07-03
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos del feature
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar layout responsivo completo en viewports: 375px, 768px, 1280px, 1440px
- [ ] Actualizar estado spec a `status: IMPLEMENTED` al completar el feature
