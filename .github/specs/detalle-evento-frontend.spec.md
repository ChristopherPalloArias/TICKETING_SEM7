---
id: SPEC-009
status: APPROVED
feature: detalle-evento-frontend
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: ["SPEC-003", "SPEC-004", "SPEC-008"]
---

# Spec: Detalle de Evento — Vista de Selección de Tickets (Frontend)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Implementación de la vista de detalle de un evento publicado (`/eventos/:id`) en el frontend de SEM7. El comprador llega desde la cartelera para ver la información completa del evento (hero animado, sinopsis, director, elenco, duración, venue), seleccionar el tier de entrada mediante un panel interactivo y proceder al flujo de reserva. Esta vista es el punto de entrada al flujo transaccional de ms-ticketing. Requiere extensión de la entidad `Event` en el backend (ms-events) para soportar campos de metadata artística y visual.

**Capa afectada:** `frontend/` (primaria) + `ms-events/` (extensión de entidad, secundaria)  
**Depende de:** SPEC-008 (cartelera-frontend), SPEC-003 (HU-03 — endpoint de detalle), SPEC-004 (HU-04 — reserva)  
**Stack:** React 19 · TypeScript 5 · CSS Modules · Vite · Axios · React Router v7 · Framer Motion · lucide-react

---

### Historias de Usuario

#### HU-FE-08: Hero animado en la vista de detalle de evento

```
Como:        Comprador
Quiero:      Ver una sección hero de pantalla completa con la imagen del evento, título y datos principales
Para:        Tener contexto visual e informativo antes de decidir si compro una entrada

Prioridad:   Alta
Estimación:  3 SP
Dependencias: SPEC-008 (cartelera — ruta de origen), SPEC-003 (endpoint GET /api/v1/events/:id)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-08

**CA-FE08-01. Hero con imagen animada y vignette**
```gherkin
Escenario: Carga del hero de detalle
  Dado que el comprador navega a /eventos/:id
  Cuando la página termina de cargar
  Entonces se muestra una sección hero de al menos 70vh (85vh en desktop)
  Y la imagen del evento aparece con animación scale 1.1 → 1 y opacity 0 → 1
  Y sobre la imagen se aplica un efecto vignette oscuro (gradiente) que garantiza legibilidad del texto
```

**CA-FE08-02. Título e información principal sobre el hero**
```gherkin
Escenario: Renderizado de datos en el hero
  Dado que el hero está visible
  Cuando la vista se renderiza
  Entonces se muestra el título del evento en mayúsculas (≥ 5xl mobile, ≥ 8xl desktop)
  Y se muestra el nombre del autor/compañía en texto secundario bajo el título
  Y si el evento tiene campo tag se muestra como badge con fondo primary-container
```

**CA-FE08-03. Bloque de metadatos: fecha, venue y duración**
```gherkin
Escenario: Metadatos del evento en el hero
  Dado que el hero está visible
  Cuando la vista termina de renderizar
  Entonces se muestra un bloque con rango de fecha de temporada (ej. "24 OCT — 12 NOV")
  Y se muestra el nombre del venue con ícono MapPin (lucide-react)
  Y se muestra la duración del espectáculo con ícono Clock (ej. "120 MIN (SIN INTERMEDIO)")
  Y todos los metadatos están en uppercase con tracking-widest
```

**CA-FE08-04. Animaciones escalonadas (stagger) del hero**
```gherkin
Escenario: Entrada escalonada de elementos del hero
  Dado que el comprador llega a la vista de detalle
  Cuando la página termina de cargar
  Entonces el badge del tag aparece primero (delay 0.5s) con slide-up + fade-in
  Y el título aparece a continuación (delay 0.7s) con slide-up + fade-in
  Y el bloque de metadatos aparece al final (delay 0.9s) con slide-up + fade-in
```

**CA-FE08-05. Hero responsivo en mobile**
```gherkin
Escenario: Hero en viewport < 768px
  Dado que el comprador accede desde mobile
  Cuando el hero se renderiza
  Entonces la altura es al menos 70vh
  Y el texto es legible sin overflow horizontal
  Y los metadatos se organizan en múltiples líneas si no caben en una sola
```

---

#### HU-FE-09: Sección de sinopsis, director y elenco del evento

```
Como:        Comprador
Quiero:      Leer la sinopsis del evento y conocer al director y elenco principal
Para:        Evaluar la calidad artística de la obra antes de comprar mi entrada

Prioridad:   Media
Estimación:  2 SP
Dependencias: HU-FE-08 (requiere estar en la página de detalle)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-09

**CA-FE09-01. Sinopsis del evento**
```gherkin
Escenario: Sección "La Obra" con descripción del evento
  Dado que el comprador está en la vista de detalle
  Cuando se desplaza hacia la sección de información
  Entonces se muestra la sinopsis del evento en tipografía ≥ xl con font-light y leading-relaxed
  Y la sección anima su entrada desde x -20 → 0 con opacity 0 → 1 al entrar en el viewport (whileInView)
  Y la animación se ejecuta una única vez (viewport: { once: true })
```

**CA-FE09-02. Tarjetas de Director y Elenco**
```gherkin
Escenario: Metadatos artísticos del evento
  Dado que la sección de información está visible
  Cuando se renderiza el bloque de detalles artísticos
  Entonces se muestran dos tarjetas en grid (1 col mobile / 2 col desktop: sm:grid-cols-2)
  Y una tarjeta muestra el nombre del Director con label "DIRECTOR" en uppercase tracking-widest
  Y la otra muestra el nombre(s) del Elenco con label "ELENCO" en uppercase tracking-widest
  Y ambas tarjetas tienen borde izquierdo color primary y fondo surface-container-low
```

**CA-FE09-03. Manejo defensivo de campos vacíos**
```gherkin
Escenario: Evento sin director o elenco definido
  Dado que el backend devuelve un evento con campo director o cast null / vacío
  Cuando la sección de información se renderiza
  Entonces las tarjetas de Director / Elenco no muestran el componente o muestran un placeholder "—"
  Y no se produce ningún error de renderizado (no-crash)
```

---

#### HU-FE-10: Selección interactiva de tier de entrada

```
Como:        Comprador
Quiero:      Seleccionar el tier de entrada (VIP, General, Early Bird) que mejor se adapte a mi presupuesto
Para:        Reservar exactamente el tipo de entrada que deseo

Prioridad:   Alta
Estimación:  5 SP
Dependencias: HU-FE-08 (página de detalle activa), SPEC-003 (tiers en GET /api/v1/events/:id)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-10

**CA-FE10-01. Lista de tiers con precio y disponibilidad**
```gherkin
Escenario: Renderizado de todos los tiers del evento
  Dado que el panel de selección de tickets está visible
  Cuando se renderiza la lista de tiers del evento
  Entonces se muestran todos los tiers (VIP, GENERAL, EARLY_BIRD) como tarjetas seleccionables
  Y cada tarjeta muestra: nombre del tier, descripción, precio formateado y estado ("Disponibles" / "AGOTADO")
  Y los tiers con isAvailable: false tienen opacidad 40%, precio tachado y etiqueta "AGOTADO"
  Y los tiers con isAvailable: false no son interactivos (cursor: not-allowed, onClick ignorado)
```

**CA-FE10-02. Selección de un tier disponible**
```gherkin
Escenario: Clic en tarjeta de tier disponible
  Dado que hay al menos un tier disponible
  Cuando el comprador hace clic en una tarjeta de tier disponible
  Entonces esa tarjeta queda visualmente seleccionada (borde primary-container, ícono CheckCircle2)
  Y el precio del tier seleccionado toma color primary-container
  Y la selección anterior (si existía) se deselecciona
```

**CA-FE10-03. Estados visuales diferenciados**
```gherkin
Escenario: Tres estados coexistentes en el panel
  Dado que el panel muestra tiers en estados: seleccionado, disponible y agotado
  Cuando se renderiza el panel
  Entonces la tarjeta seleccionada tiene borde primary-container + fondo surface-container
  Y la tarjeta disponible no seleccionada tiene borde outline-variant + fondo surface-container-high + hover → surface-bright
  Y la tarjeta agotada tiene opacidad 40% + fondo surface-container-lowest + borde outline-variant/5
```

**CA-FE10-04. Tag opcional por tier**
```gherkin
Escenario: Tier con etiqueta especial (ej. "Mejor Vista")
  Dado que un tier tiene campo tag definido
  Cuando la tarjeta de ese tier se renderiza
  Entonces se muestra el tag como pill badge con fondo primary-container/20 y texto primary-container en uppercase
  Y el badge se posiciona junto al nombre del tier
```

**CA-FE10-05. Animaciones de interacción Framer Motion**
```gherkin
Escenario: Feedback visual al interactuar con tarjetas disponibles
  Dado que el comprador interactúa con una tarjeta de tier disponible
  Cuando hace hover sobre ella
  Entonces la tarjeta escala a 1.02 (whileHover)
  Cuando hace clic
  Entonces la tarjeta encoge a 0.98 brevemente (whileTap)
  Y los tiers agotados no ejecutan ninguna animación de hover ni tap
```

**CA-FE10-06. Preselección del primer tier disponible**
```gherkin
Escenario: Inicialización del panel al cargar
  Dado que la página de detalle carga por primera vez
  Cuando se monta el panel de tiers
  Entonces el primer tier con isAvailable: true queda preseleccionado automáticamente
  Y si no hay ningún tier disponible el panel muestra un estado "Sin disponibilidad"
```

---

#### HU-FE-11: Panel sticky de reserva con CTA principal

```
Como:        Comprador
Quiero:      Que el panel de selección de tickets permanezca visible mientras hago scroll
Para:        Reservar en cualquier momento sin tener que volver al inicio de la página

Prioridad:   Alta
Estimación:  3 SP
Dependencias: HU-FE-10 (panel de tiers), SPEC-004 (flujo de reserva)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-11

**CA-FE11-01. Panel sticky en desktop durante scroll**
```gherkin
Escenario: Panel de tickets fijo en desktop
  Dado que el comprador está en la vista de detalle en viewport >= 1024px
  Cuando hace scroll hacia abajo por la sección de información
  Entonces el panel de selección de tickets permanece fijo en la columna derecha (position sticky, top 28)
  Y es visible durante todo el recorrido de lectura del evento
```

**CA-FE11-02. Botón "Reservar" habilitado solo con tier seleccionado**
```gherkin
Escenario: Estado del botón en función de la selección
  Dado que el comprador está en el panel
  Cuando no tiene ningún tier seleccionado
  Entonces el botón "Reservar" aparece deshabilitado / sin estilo activo
  Cuando selecciona un tier disponible
  Entonces el botón "Reservar" se activa con estilo primary-gradient
```

**CA-FE11-03. Botón "Reservar" navega al flujo de checkout**
```gherkin
Escenario: Clic en Reservar con tier seleccionado
  Dado que el comprador ha seleccionado un tier disponible
  Cuando hace clic en el botón "Reservar"
  Entonces el estado de pantalla cambia a 'checkout'
  Y se renderiza la pantalla "Finalizar Reserva" con el tier y evento seleccionados
  Y el temporizador de reserva (09:59) inicia en el navbar (ver checkout-pago-frontend spec)
```

**CA-FE11-04. Animación del botón CTA**
```gherkin
Escenario: Feedback de interacción en el botón Reservar
  Dado que el botón "Reservar" está habilitado
  Cuando el comprador hace hover
  Entonces el botón escala a 1.02 (whileHover)
  Cuando hace clic
  Entonces el botón encoge a 0.98 (whileTap)
```

**CA-FE11-05. Mensaje de política de reembolso**
```gherkin
Escenario: Información de garantía visible en el panel
  Dado que el panel de tickets está visible
  Cuando el comprador lo visualiza
  Entonces se muestra el texto "Garantía de reembolso hasta 48h antes" bajo el botón
  Y el texto tiene estilo discreto: uppercase, tracking-widest, color on-surface-variant con opacidad baja
```

**CA-FE11-06. Panel no sticky en mobile**
```gherkin
Escenario: Layout del panel en mobile (< 1024px)
  Dado que el comprador accede desde mobile
  Cuando visualiza la vista de detalle
  Entonces el panel de tickets se muestra debajo de la columna de información
  Y ocupa el ancho completo de la pantalla
  Y no es sticky (solo se aplica sticky en lg:)
```

---

#### HU-FE-12: Barra de navegación inferior con ítem Profile

```
Como:        Comprador en dispositivo móvil
Quiero:      Acceder a Explorar, Venues, Payment y Perfil desde la barra inferior
Para:        Navegar entre secciones y seguir mi compra con una sola mano

Prioridad:   Media
Estimación:  1 SP
Dependencias: SPEC-008 HU-FE-06 (BottomNav de 3 ítems ya implementado)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-12

**CA-FE12-01. Bottom nav con cuatro ítems**
```gherkin
Escenario: Bottom nav con 4 ítems en mobile
  Dado que el comprador accede desde mobile (< 768px)
  Cuando la barra de navegación inferior se renderiza
  Entonces se muestran exactamente cuatro ítems: Explore (Search), Venues (MapPin), Payment (CreditCard), Profile (User)
  Y cada ítem tiene un ícono lucide-react y un label en uppercase
  Y los cuatro ítems están equiespaciados sin superposición en 320px
```

**CA-FE12-02. Estado activo sincronizado con el estado de pantalla**
```gherkin
Escenario: Ítem activo según la pantalla actual
  Dado que el comprador navega por las pantallas de la aplicación
  Cuando la pantalla activa es 'catalog'
  Entonces el ítem Explore se muestra en color primary
  Cuando la pantalla es 'checkout', 'payment' o 'failure'
  Entonces el ítem Payment se muestra en color primary
  Cuando la pantalla es 'success'
  Entonces el ítem Profile se muestra en color primary
  Y los ítems inactivos se muestran en color on-surface-variant con opacidad 60%
```

**CA-FE12-03. Bottom nav sigue oculto en desktop**
```gherkin
Escenario: Bottom nav en viewport >= 768px
  Dado que el comprador accede desde desktop
  Cuando la página se renderiza
  Entonces la barra inferior NO es visible (hidden md:)
```

---

### Reglas de Negocio

1. **Ruta de detalle:** La URL `/eventos/:id` recibe el UUID del evento. Si el evento no existe o no está publicado, la vista muestra un estado de error (404-like) sin redirigir.
2. **Tier preseleccionado:** Al montar el panel, el primer tier con `isAvailable: true` se preselecciona automáticamente. Si todos los tiers están no disponibles, el botón "Reservar" permanece deshabilitado.
3. **Navegación a checkout:** El botón "Reservar" cambia el estado de pantalla a `'checkout'` en el mismo componente o via estado global (no realiza `POST /api/v1/reservations` aquí — eso ocurre en el checkout, ver SPEC-004).
4. **Animaciones hero (mount-only):** Las animaciones de entrada del hero se ejecutan una sola vez al montar la page. No se repiten en re-renders.
5. **Animaciones whileInView (scroll):** Las animaciones de la sección de información se ejecutan una sola vez al entrar en el viewport (`{ once: true }`).
6. **Campos de metadata artística opcionales:** Los campos `director`, `cast`, `duration`, `imageUrl`, `tag` e `isLimited` son opcionales en el backend. El frontend los renderiza condicionalmente sin error si vienen `null`.
7. **Panel sticky exclusivo en desktop:** El comportamiento `sticky` del panel derecho aplica solo en `lg:` (>= 1024px). En mobile el panel se apila debajo del contenido.
8. **Bottom nav — 4 ítems:** La extensión de BottomNav de 3 a 4 ítems (HU-FE-12) implica reemplazar el ítem "Tickets" (Ticket icon) por "Payment" (CreditCard icon) y agregar "Profile" (User icon). Esta actualización puede afectar la spec de `cartelera-frontend` (SPEC-008 HU-FE-06).

---

## 2. DISEÑO

### Modelos de Datos

#### Extensión requerida en `Event` (ms-events)

> Los campos de metadata artística no existen actualmente en la entidad `Event`. Son necesarios para renderizar la vista de detalle completa. Se deben agregar como columnas opcionales (nullable).

| Campo | Tipo Java | Tipo SQL | Obligatorio | Descripción |
|-------|-----------|----------|-------------|-------------|
| `imageUrl` | `String` | `VARCHAR(500)` | No | URL de la imagen del evento para hero y tarjetas |
| `director` | `String` | `VARCHAR(200)` | No | Nombre del director artístico |
| `cast` | `String` | `VARCHAR(500)` | No | Nombre(s) del elenco principal (texto libre) |
| `duration` | `Integer` | `INTEGER` | No | Duración en minutos (ej. 120) |
| `tag` | `String` | `VARCHAR(100)` | No | Etiqueta editorial (ej. "FEATURED PERFORMANCE", "Estreno Mundial") |
| `isLimited` | `Boolean` | `BOOLEAN` | No | Indica aforo reducido; badge independiente del campo `tag` |
| `author` | `String` | `VARCHAR(200)` | No | Nombre del autor o compañía de teatro |

> **Nota:** Estos campos deben ser `nullable = true` en la entidad JPA. El `EventDetailResponse` DTO debe exponer todos ellos. Los campos `imageUrl`, `tag` e `isLimited` también deben incluirse en la respuesta de `GET /api/v1/events` (listado) para que la cartelera (SPEC-008) los pueda consumir.

#### Migration SQL requerida (ms-events)

```sql
-- V3__add_event_metadata_fields.sql
ALTER TABLE event ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE event ADD COLUMN IF NOT EXISTS director VARCHAR(200);
ALTER TABLE event ADD COLUMN IF NOT EXISTS cast VARCHAR(500);
ALTER TABLE event ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE event ADD COLUMN IF NOT EXISTS tag VARCHAR(100);
ALTER TABLE event ADD COLUMN IF NOT EXISTS is_limited BOOLEAN DEFAULT FALSE;
ALTER TABLE event ADD COLUMN IF NOT EXISTS author VARCHAR(200);
```

#### `EventDetailResponse` DTO actualizado

```java
public record EventDetailResponse(
    UUID id,
    String title,
    String description,        // sinopsis
    LocalDateTime date,
    Integer capacity,
    RoomResponse room,
    List<AvailableTierResponse> availableTiers,
    LocalDateTime created_at,
    // Nuevos campos
    String imageUrl,
    String director,
    String cast,
    Integer duration,
    String tag,
    Boolean isLimited,
    String author
) {}
```

#### Interfaces TypeScript actualizadas (frontend)

```typescript
// types/event.types.ts — extensión para detalle

interface EventResponse {
  id: string;
  title: string;
  description: string;       // sinopsis
  date: string;
  capacity: number;
  room: RoomResponse;
  availableTiers: TierResponse[];
  imageUrl?: string;
  created_at: string;
  // Campos nuevos (SPEC-008 + SPEC-009)
  tag?: string;
  isLimited?: boolean;
  // Campos de detalle (SPEC-009)
  director?: string;
  cast?: string;
  duration?: number;         // minutos
  author?: string;
}

// Hook de detalle
interface UseEventDetailResult {
  event: EventResponse | null;
  loading: boolean;
  error: string | null;
}
```

---

### API Endpoints

#### GET /api/v1/events/{id}

- **Microservicio:** ms-events → api-gateway → frontend
- **Descripción:** Obtiene el detalle completo de un evento publicado por su UUID
- **Auth requerida:** No (acceso público)
- **Path Param:** `id` — UUID del evento
- **Response 200:**
  ```json
  {
    "id": "uuid",
    "title": "Hamlet — Revisitado",
    "description": "Sinopsis extensa del espectáculo...",
    "date": "2026-10-24T20:00:00Z",
    "capacity": 500,
    "imageUrl": "https://cdn.example.com/hamlet.jpg",
    "author": "William Shakespeare / Cía. Teatro SEM7",
    "director": "Ana García Lorca",
    "cast": "Carlos Pérez, Elena Martínez, Sofía Ruiz",
    "duration": 120,
    "tag": "Estreno Mundial",
    "isLimited": false,
    "room": {
      "id": "uuid",
      "name": "Sala Principal",
      "maxCapacity": 500
    },
    "availableTiers": [
      {
        "id": "uuid",
        "tierType": "VIP",
        "price": "150.00",
        "quota": 20,
        "validFrom": null,
        "validUntil": null,
        "isAvailable": true,
        "reason": null
      },
      {
        "id": "uuid",
        "tierType": "GENERAL",
        "price": "80.00",
        "quota": 0,
        "validFrom": null,
        "validUntil": null,
        "isAvailable": false,
        "reason": "SOLD_OUT"
      }
    ],
    "created_at": "2026-03-01T10:00:00Z"
  }
  ```
- **Response 404:** evento no encontrado o no publicado
  ```json
  { "error": "EVENT_NOT_FOUND", "message": "El evento no existe o no está disponible." }
  ```
- **Response 500:** error inesperado del servidor

> **Estado actual:** El endpoint `GET /api/v1/events/{id}` ya existe en ms-events pero no devuelve los campos `imageUrl`, `director`, `cast`, `duration`, `tag`, `isLimited` ni `author`. Se requiere extender la entidad y el DTO como pre-condición de este feature.

---

### Diseño Frontend

#### Nuevos componentes

| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `EventHero` | `components/EventHero/EventHero.tsx` | `event: EventResponse` | Hero de pantalla completa con imagen animada (Framer Motion), vignette, badge de tag, título stagger y bloque de metadatos (fecha, venue, duración) |
| `EventInfoCard` | `components/EventInfo/EventInfoCard.tsx` | `label: string`, `value: string` | Tarjeta de metadato artístico con borde izquierdo primary. Usada para Director y Elenco |
| `TicketTier` | `components/TicketTier/TicketTier.tsx` | `tier: TierResponse`, `selected: boolean`, `onClick: () => void` | Tarjeta de tier con tres estados visuales (selected / available / disabled). Animaciones whileHover/whileTap. Badge de tag opcional. Ícono CheckCircle2 cuando selected |
| `TicketPanel` | `components/TicketTier/TicketPanel.tsx` | `tiers: TierResponse[]`, `selectedTierId: string \| null`, `onSelect: (tierId: string) => void`, `onReservar: () => void` | Panel sticky (lg:) contenedor de la lista `TicketTier` + botón CTA + política de reembolso |

#### Nueva página

| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `EventDetail` | `pages/EventDetail/EventDetail.tsx` | `/eventos/:id` | No — acceso público |

**Layout de EventDetail:** `grid-cols-1 lg:grid-cols-12` con columna de información (lg:col-span-7) a la izquierda y `TicketPanel` sticky (lg:col-span-5) a la derecha.

#### Componentes existentes a modificar

| Componente | Cambio |
|------------|--------|
| `BottomNav` (`components/NavBar/BottomNav.tsx`) | Agregar 4.° ítem "Profile" (User icon). Reemplazar "Tickets" por "Payment" (CreditCard). Recibir `activeTab: string` para mapear estado de pantalla → ítem activo. |
| `App.tsx` | Agregar ruta `/eventos/:id` → `EventDetail` |
| `event.types.ts` | Agregar `director?`, `cast?`, `duration?`, `author?` en `EventResponse` (extends campos ya agregados en SPEC-008) |

#### Nuevo hook

| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useEventDetail` | `hooks/useEventDetail.ts` | `{ event, loading, error }` | Llama a `getEventById(id)` al montar. Maneja estados loading/error. Tipo retorno: `EventResponse \| null` |

#### Extensión de servicios

| Función | Archivo | Endpoint |
|---------|---------|---------|
| `getEventById(id: string)` | `services/eventService.ts` | `GET ${VITE_API_URL}/api/v1/events/:id` |

#### Tokens de diseño (Teatro Noir — sin cambios)

Todos los tokens necesarios ya están en `styles/tokens.module.css`. Se usan:

| Token | Uso en este feature |
|-------|---------------------|
| `--color-primary` (#FF6B47) | Borde izquierdo de EventInfoCard, hover de íconos en BottomNav |
| `--color-surface` (#1C1C1C) | Fondo hero, gradiente vignette |
| `--color-surface-container` (#242424) | Fondo tarjetas de tier seleccionadas y EventInfoCard |
| `--color-on-surface` (#E5E2E1) | Texto del hero, nombre del tier, metadatos |
| `--color-on-surface-variant` (#B8A9A5) | Label DIRECTOR/ELENCO, política de reembolso, ítems inactivos BottomNav |
| `--color-outline-variant` (#3A3A3A) | Borde de tarjetas de tier disponibles |

#### Nuevos archivos CSS Modules

| Módulo | Usado por |
|--------|-----------|
| `EventHero.module.css` | `EventHero` — hero height, vignette, overlay layout |
| `EventInfo.module.css` | `EventInfoCard` — borde izquierdo, grid de tarjetas |
| `TicketTier.module.css` | `TicketTier` — estados selected/available/disabled, badge tag |
| `TicketPanel.module.css` | `TicketPanel` — sticky wrapper, botón CTA, texto reembolso |
| `EventDetail.module.css` | `EventDetail` — layout 12-col, columnas info/panel |

#### Arquitectura y dependencias

- **Paquetes existentes suficientes:** `framer-motion`, `lucide-react`, `axios`, `react-router-dom` (ya usados en SPEC-008)
- **Impacto en App.tsx:** Registrar ruta `/eventos/:id → EventDetail`
- **Estado de pantalla (checkout):** El flujo de checkout (`'checkout'`, `'payment'`, `'success'`, `'failure'`) gestionado en `EventDetail.tsx` o en contexto global (a definir en la spec de checkout-pago-frontend). El botón "Reservar" muta el estado sin realizar petición HTTP.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend (ms-events — pre-condición)

> Estos cambios son requeridos para que el frontend pueda mostrar la vista completa. Deben completarse antes de la integración frontend.

#### Extensión del modelo y migración
- [ ] Agregar campos `imageUrl`, `director`, `cast`, `duration`, `tag`, `isLimited`, `author` en entidad `Event` (`nullable = true` en JPA)
- [ ] Crear migration Flyway `V3__add_event_metadata_fields.sql` con `ALTER TABLE event ADD COLUMN IF NOT EXISTS ...`
- [ ] Actualizar `EventDetailResponse` record para incluir los 7 campos nuevos
- [ ] Actualizar `convertToEventDetailResponse()` en `EventService` para mapear los nuevos campos
- [ ] Extender también `EventResponse` (listado cartelera) con `imageUrl`, `tag`, `isLimited` (requerido por SPEC-008)
- [ ] Actualizar `EventCreateRequest` y `EventUpdateRequest` para aceptar los nuevos campos opcionales

#### Tests Backend
- [ ] `test_get_event_detail_returns_director_cast_duration` — campos de metadata en respuesta
- [ ] `test_get_event_detail_with_null_optional_fields` — campos opcionales null no rompen la respuesta
- [ ] `test_get_event_detail_not_found_returns_404` — evento inexistente o no publicado

---

### Frontend

#### Tipos y contratos
- [ ] Agregar `director?`, `cast?`, `duration?`, `author?` en interfaz `EventResponse` (`types/event.types.ts`)
- [ ] Crear interfaz `UseEventDetailResult` en `types/event.types.ts` o en el propio hook
- [ ] Verificar que `EventViewModel` extiende todos los campos sin duplicar los ya agregados en SPEC-008

#### Services
- [ ] Implementar función `getEventById(id: string)` en `services/eventService.ts` — `GET ${VITE_API_URL}/api/v1/events/:id`

#### Hook useEventDetail
- [ ] Crear `hooks/useEventDetail.ts` con estados `event: EventResponse | null`, `loading: boolean`, `error: string | null`
- [ ] Llamar a `getEventById(id)` al montar el hook (usando `id` de `useParams`)
- [ ] Manejar cleanup con flag `cancelled` para evitar setState tras unmount
- [ ] Devolver `error` descriptivo cuando la respuesta es 404 o 5xx

#### Componente EventHero (nuevo)
- [ ] Crear `components/EventHero/EventHero.tsx` con prop `event: EventResponse`
- [ ] Implementar imagen con `motion.img`: `initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }}`
- [ ] Aplicar vignette con pseudo-elemento o div overlay con `background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)`
- [ ] Implementar animaciones stagger con `motion.div` para badge (delay 0.5), título (delay 0.7) y metadatos (delay 0.9)
- [ ] Renderizar badge de tag condicionalmente cuando `event.tag` tiene valor
- [ ] Renderizar bloque de metadatos: fecha formateada, `room.name` con MapPin, `duration` con Clock
- [ ] Crear `EventHero.module.css` con alturas `70vh` (mobile) / `85vh` (desktop) y estilos de overlay

#### Componente EventInfoCard (nuevo)
- [ ] Crear `components/EventInfo/EventInfoCard.tsx` con props `label: string`, `value: string`
- [ ] Aplicar borde izquierdo `4px solid var(--color-primary)` y fondo `var(--color-surface-container)`
- [ ] Crear `EventInfo.module.css`

#### Componente TicketTier (nuevo)
- [ ] Crear `components/TicketTier/TicketTier.tsx` con props `tier: TierResponse`, `selected: boolean`, `onClick: () => void`
- [ ] Implementar tres variantes de estilo CSS Module condicional: `selected`, `available`, `disabled` (basado en `tier.isAvailable` y `selected`)
- [ ] Renderizar `CheckCircle2` (lucide-react) condicionalmente cuando `selected === true`
- [ ] Aplicar `whileHover={{ scale: 1.02 }}` y `whileTap={{ scale: 0.98 }}` solo cuando `!disabled`
- [ ] Renderizar badge de tag del tier condicionalmente cuando `tier.tag` tiene valor (pill: fondo primary-container/20, texto primary-container)
- [ ] Tachar precio (`line-through`) cuando `tier.isAvailable === false`
- [ ] Crear `TicketTier.module.css`

#### Componente TicketPanel (nuevo)
- [ ] Crear `components/TicketTier/TicketPanel.tsx` con props `tiers`, `selectedTierId`, `onSelect`, `onReservar`
- [ ] Renderizar lista de `TicketTier` con lógica de selección única
- [ ] Inicializar selección con el primer tier disponible al montar (`useEffect`)
- [ ] Implementar botón "Reservar" como `motion.button` con `whileHover={{ scale: 1.02 }}` y `whileTap={{ scale: 0.98 }}`
- [ ] Deshabilitar botón "Reservar" cuando `selectedTierId === null`
- [ ] Agregar ícono `ArrowRight` (lucide-react) dentro del botón
- [ ] Agregar texto estático de política de reembolso bajo el botón
- [ ] Crear `TicketPanel.module.css`

#### Página EventDetail (nueva)
- [ ] Crear `pages/EventDetail/EventDetail.tsx` con uso de `useEventDetail(id)` y `useParams`
- [ ] Implementar layout `grid-cols-1 lg:grid-cols-12` — columna info (lg:col-span-7) y columna panel sticky (lg:col-span-5)
- [ ] Renderizar `EventHero` en la parte superior (ancho completo, fuera del grid de columnas)
- [ ] Renderizar sección "La Obra" con sinopsis (`motion.div` whileInView `{ once: true }`, `x: -20 → 0`)
- [ ] Renderizar dos `EventInfoCard` en `grid-cols-1 sm:grid-cols-2` para Director y Elenco
- [ ] Renderizar `TicketPanel` en columna derecha con `sticky top-28 (lg:)`
- [ ] Manejar estados loading (skeleton) y error (mensaje descriptivo + link "Volver a la Cartelera")
- [ ] Manejar acción "Reservar" cambiando estado local `screen` a `'checkout'` (preparar para SPEC checkout-pago-frontend)
- [ ] Crear `EventDetail.module.css`

#### Routing y navegación
- [ ] Agregar ruta `/eventos/:id → <EventDetail />` en `App.tsx`
- [ ] Actualizar `BottomNav.tsx`: agregar ítem 4 "Profile" (User icon), reemplazar "Tickets" por "Payment" (CreditCard icon)
- [ ] Actualizar prop `activeTab` en `BottomNav` para mapear estado `'checkout' | 'payment' | 'failure'` → `'payment'` y `'success'` → `'profile'`
- [ ] Verificar que el clic en botón "Reservar" de `EventCard.tsx` (cartelera) navega a `/eventos/:id` con `useNavigate`

---

### QA

#### HU-FE-08 — Hero animado
- [ ] Verificar animación de imagen (scale 1.1 → 1) al cargar la página
- [ ] Verificar secuencia de aparición: badge → título → metadatos con delays visibles
- [ ] Verificar que el vignette garantiza legibilidad del título blanco sobre la imagen
- [ ] Verificar altura hero 70vh en mobile y 85vh en desktop (375px y 1280px)
- [ ] Verificar que el título no produce overflow horizontal en 375px

#### HU-FE-09 — Sinopsis, Director, Elenco
- [ ] Verificar que la sinopsis tiene contraste adecuado (WCAG AA) sobre fondo oscuro
- [ ] Verificar grid 2 columnas en desktop y 1 columna en mobile para Director/Elenco
- [ ] Verificar animación whileInView ocurre solo al hacer scroll y solo una vez
- [ ] Verificar que campos null no producen crash (sin texto o con placeholder "—")

#### HU-FE-10 — Selección de tier
- [ ] Verificar que solo un tier puede estar seleccionado a la vez
- [ ] Verificar que clic en tier AGOTADO no cambia la selección
- [ ] Verificar tres estados visuales con opacidad y colores correctos
- [ ] Verificar que CheckCircle2 aparece en el tier seleccionado y desaparece al cambiar selección
- [ ] Verificar animaciones whileHover/whileTap solo en tiers disponibles
- [ ] Verificar que el primer tier disponible queda preseleccionado al cargar

#### HU-FE-11 — Panel sticky y CTA
- [ ] Verificar comportamiento sticky en desktop durante scroll completo de la página
- [ ] Verificar que en mobile el panel pierde sticky y se apila bajo la información
- [ ] Verificar botón Reservar deshabilitado sin selección, activo con selección
- [ ] Verificar animaciones whileHover/whileTap en el botón CTA
- [ ] Verificar que el texto de reembolso es legible y no distrae del CTA
- [ ] Verificar que el ícono ArrowRight es visible en el botón

#### HU-FE-12 — Bottom nav 4 ítems
- [ ] Verificar que la bottom nav muestra exactamente 4 ítems: Explore, Venues, Payment, Profile
- [ ] Verificar que Payment (CreditCard) se activa en checkout/pago/fallo
- [ ] Verificar que Profile (User) se activa en la pantalla de éxito
- [ ] Verificar que Explore (Search) se activa en cartelera y detalle de evento
- [ ] Verificar que los 4 ítems están equiespaciados en viewport 320px
- [ ] Verificar que la bottom nav sigue oculta en desktop >= 768px

#### General
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CA-FE08-01 a CA-FE12-03
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos del feature
- [ ] Validar layout responsivo completo: 375px, 768px, 1024px, 1280px
- [ ] Verificar que `/eventos/:id` con UUID inválido muestra estado de error sin crash
- [ ] Verificar navegación de vuelta a la cartelera desde el estado de error
- [ ] Actualizar estado spec a `status: IMPLEMENTED` al completar el feature
