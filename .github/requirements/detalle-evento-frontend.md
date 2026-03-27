# Requerimiento: Detalle de Evento — Vista de Selección de Tickets (Frontend)

## Contexto del feature

Implementación de la vista de detalle de un evento publicado en SEM7. El comprador accede a esta página desde la cartelera para ver la información completa del evento (sinopsis, director, elenco, fechas, duración, venue), seleccionar el tier de entrada y proceder a la reserva. El backend ya expone la información del evento a través de `GET /api/v1/events/{id}` (ms-events). Esta vista es el punto de entrada al flujo de reserva (ms-ticketing).

**Capa afectada:** `frontend/`
**Depende de:** HU-FE-01 (cartelera), HU-03 (ms-events — detalle de evento por ID), HU-04 (ms-ticketing — creación de reserva)
**Stack:** React · TypeScript · CSS Modules · Vite · Axios · React Router · Framer Motion
**Diseño de referencia:** Teatro Noir — fondo oscuro, acento salmon/naranja, hero de pantalla completa con efecto vignette, tipografía serif en mayúsculas

---

## Escala de estimación
Fibonacci: 1, 2, 3, 5, 8, 13

## Definition of Ready (DoR)
- Formato Como / Quiero / Para redactado correctamente
- Valor de negocio identificable y claro
- Criterios de aceptación definidos en Gherkin
- Estimación en Story Points asignada
- Historia cargada en el tablero de GitHub Projects

## Definition of Done (DoD)
- Formato Como / Quiero / Para completo y claro
- Criterios de aceptación escritos en Gherkin declarativo
- Escenarios cubren el camino feliz y los casos alternos o límite
- Tasking desglosado desde la perspectiva DEV y QA
- Estimación en Story Points asignada y justificada
- Historia registrada en el tablero de GitHub Projects
- Commit atómico subido al repositorio con mensaje descriptivo

---

## Historias de Usuario

### HU-FE-08: Hero animado en la vista de detalle de evento — SP: 3

Como **Comprador**
Quiero ver una sección hero de pantalla completa con la imagen del evento, su título y sus datos principales
Para tener un contexto visual e informativo del evento antes de decidir si compro una entrada

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** Requiere animaciones de entrada coordinadas con Framer Motion (scale + opacity en imagen, staggered y-slide en texto), efecto vignette con CSS, y presentación responsive de metadatos (fecha, venue, duración) con íconos lucide-react.

#### Criterios de Aceptación

**CA-01. Hero muestra imagen del evento con animación de entrada**
```gherkin
Escenario: Carga del hero de detalle
  Dado que el comprador navega a la vista de detalle de un evento (/eventos/:id)
  Cuando la página termina de cargar
  Entonces se muestra una sección hero de al menos 70vh de altura (85vh en desktop)
  Y la imagen del evento aparece con animación de escala descendente (1.1 → 1) y fade-in
  Y sobre la imagen se aplica un efecto de vignette oscuro que asegura legibilidad del texto
```

**CA-02. Título e información principal del evento sobre el hero**
```gherkin
Escenario: Renderizado de datos del evento en el hero
  Dado que el hero del evento está visible
  Cuando la vista se renderiza
  Entonces se muestra el título del evento en tipografía grande (≥ 5xl en mobile, ≥ 8xl en desktop) en mayúsculas
  Y se muestra el nombre del autor/compañía en texto secundario
  Y si el evento tiene un tag (ej. "Estreno Mundial") se muestra como badge con fondo primary-container
```

**CA-03. Metadatos de fecha, venue y duración en el hero**
```gherkin
Escenario: Bloque de metadatos del evento
  Dado que el hero del evento está visible
  Cuando la vista se renderiza
  Entonces se muestra un bloque debajo del título con fecha de temporada (ej. "24 OCT — 12 NOV")
  Y se muestra el nombre del venue con ícono MapPin
  Y se muestra la duración del espectáculo con ícono Clock (ej. "120 MIN (SIN INTERMEDIO)")
  Y todos los metadatos están en uppercase con tracking-widest
```

**CA-04. Hero animado con entradas escalonadas (stagger)**
```gherkin
Escenario: Animaciones escalonadas del hero
  Dado que el comprador llega a la vista de detalle
  Cuando la página termina de cargar
  Entonces el badge del tag aparece primero (delay 0.5s)
  Y el título aparece a continuación (delay 0.7s)
  Y el bloque de metadatos aparece al final (delay 0.9s)
  Y todas las animaciones son de tipo slide-up + fade-in
```

**CA-05. Hero adaptado a dispositivos móviles**
```gherkin
Escenario: Visualización del hero en mobile
  Dado que el comprador accede desde un dispositivo con pantalla < 768px
  Cuando el hero se renderiza
  Entonces la altura del hero es al menos 70vh
  Y el texto es legible sobre la imagen sin overflow horizontal
  Y los metadatos se organizan en múltiples líneas si no caben en una sola
```

#### Subtasks

**DEV**
- [ ] Crear página `pages/EventDetail/EventDetail.tsx` con layout de sección hero + contenido principal
- [ ] Crear componente `components/EventHero/EventHero.tsx` con imagen animada, vignette y metadatos
- [ ] Agregar clase `.noir-vignette` en estilos globales (gradiente radial o linear oscuro)
- [ ] Implementar animaciones con `motion.img` y `motion.div` de Framer Motion con los delays especificados
- [ ] Registrar ruta `/eventos/:id` en el router de la aplicación
- [ ] Obtener datos del evento desde `GET /api/v1/events/:id` en un hook `useEventDetail.ts`

**QA**
- [ ] Verificar animación de imagen (scale 1.1 → 1) al cargar la página
- [ ] Verificar secuencia de aparición escalonada del badge, título y metadatos
- [ ] Verificar que el efecto vignette no oscurece en exceso el texto blanco
- [ ] Verificar altura del hero en mobile (70vh) y desktop (85vh)
- [ ] Verificar que el título no produce overflow horizontal en mobile

---

### HU-FE-09: Sección de sinopsis, director y elenco del evento — SP: 2

Como **Comprador**
Quiero leer la sinopsis del evento y conocer al director y el elenco principal
Para evaluar la calidad artística de la obra antes de comprar mi entrada

**Prioridad:** Media
**Estimación:** 2 SP
**Justificación SP:** Sección informativa con animación de entrada `whileInView`. Dos tarjetas de metadatos (director, elenco) en grid. Complejidad baja con texto enriquecido.

#### Criterios de Aceptación

**CA-01. Sinopsis del evento visible en la columna de información**
```gherkin
Escenario: Sección "La Obra" con descripción del evento
  Dado que el comprador está en la vista de detalle de un evento
  Cuando se desplaza hacia la sección de información
  Entonces se muestra un bloque con la sinopsis o descripción del evento
  Y el bloque anima su entrada desde la izquierda con fade-in al entrar en el viewport (whileInView)
  Y la sinopsis usa tipografía grande (xl o superior) con `font-light` y `leading-relaxed`
```

**CA-02. Tarjetas de Director y Elenco**
```gherkin
Escenario: Metadatos artísticos: director y elenco
  Dado que la sección de información está visible
  Cuando se renderiza el bloque de detalles artísticos
  Entonces se muestran dos tarjetas en grid (1 col mobile / 2 col desktop)
  Y una tarjeta muestra el nombre del Director con label "Director" en uppercase tracking-widest
  Y la otra muestra el nombre(s) del Elenco con label "Elenco" en uppercase tracking-widest
  Y ambas tarjetas tienen borde izquierdo con color primary y fondo surface-container-low
```

**CA-03. Animación de entrada al hacer scroll**
```gherkin
Escenario: Animación whileInView en la columna izquierda
  Dado que el comprador realiza scroll hacia la sección de información
  Cuando el bloque entra en el viewport
  Entonces el bloque anima desde x: -20 → x: 0 con opacity 0 → 1
  Y la animación se ejecuta una única vez (viewport: { once: true })
```

#### Subtasks

**DEV**
- [ ] Crear sección `<section>` de "La Obra" en `EventDetail.tsx` con `motion.div` whileInView
- [ ] Crear componente `EventInfoCard.tsx` para Director y Elenco con props: `label`, `value`
- [ ] Renderizar ambas tarjetas en un `grid grid-cols-1 sm:grid-cols-2`

**QA**
- [ ] Verificar que la sinopsis es legible con contraste adecuado sobre fondo oscuro
- [ ] Verificar grid de 2 columnas en desktop y 1 columna en mobile
- [ ] Verificar que la animación whileInView ocurre solo una vez al hacer scroll
- [ ] Verificar que el componente no falla si director o elenco vienen vacíos del backend

---

### HU-FE-10: Selección interactiva de tier de entrada — SP: 5

Como **Comprador**
Quiero seleccionar el tier de entrada (VIP, General, Early Bird) que mejor se adapte a mi presupuesto y preferencias
Para reservar exactamente el tipo de entrada que deseo

**Prioridad:** Alta
**Estimación:** 5 SP
**Justificación SP:** Historia central del flujo de compra. Requiere componente `TicketTier` con tres estados visuales (available, selected, disabled/sold out), lógica de selección con estado local, renderizado condicional de indicador de selección (CheckCircle2), tag opcional por tier y validación de habilitación del botón de reserva.

#### Criterios de Aceptación

**CA-01. Lista de tiers del evento con precio y disponibilidad**
```gherkin
Escenario: Renderizado de tiers disponibles y agotados
  Dado que el comprador está en la vista de detalle de un evento
  Cuando el panel de selección de tickets se renderiza
  Entonces se muestran todos los tiers del evento (VIP, General, Early Bird) como tarjetas seleccionables
  Y cada tarjeta muestra: nombre del tier, descripción, precio y estado de disponibilidad ("Disponibles" / "AGOTADO")
  Y los tiers con `isAvailable: false` se muestran con opacidad reducida, precio tachado y estado "AGOTADO"
  Y los tiers con `isAvailable: false` no son interactivos (cursor not-allowed)
```

**CA-02. Selección de un tier disponible**
```gherkin
Escenario: Selección de tier disponible por el comprador
  Dado que hay al menos un tier disponible en el panel de tickets
  Cuando el comprador hace clic en una tarjeta de tier disponible
  Entonces esa tarjeta queda visualmente seleccionada (borde primary-container, ícono CheckCircle2 en la esquina)
  Y el precio del tier seleccionado cambia a color primary-container
  Y la selección anterior (si existía) se deselecciona
```

**CA-03. Estado visual diferenciado: seleccionado, disponible, agotado**
```gherkin
Escenario: Estados visuales de las tarjetas de tier
  Dado que el panel de tickets muestra tres tiers
  Cuando uno está seleccionado, otro disponible y otro agotado
  Entonces la tarjeta seleccionada tiene borde primary-container y fondo surface-container
  Y la tarjeta disponible no seleccionada tiene borde outline-variant y fondo surface-container-high con hover a surface-bright
  Y la tarjeta agotada tiene opacidad 40%, fondo surface-container-lowest y borde outline-variant/5
```

**CA-04. Tag opcional en tarjeta de tier**
```gherkin
Escenario: Tier con tag especial (ej. "Mejor Vista")
  Dado que un tier tiene un tag definido (ej. "Mejor Vista")
  Cuando la tarjeta de ese tier se renderiza
  Entonces se muestra el tag como pill badge junto al nombre del tier
  Y el badge tiene fondo primary-container/20 y texto primary-container en uppercase
```

**CA-05. Animación de interacción en tarjetas de tier**
```gherkin
Escenario: Feedback visual al interactuar con tarjetas
  Dado que el comprador interactúa con una tarjeta de tier disponible
  Cuando hace hover sobre ella
  Entonces la tarjeta escala ligeramente (scale: 1.02) con animación Framer Motion
  Cuando hace clic
  Entonces la tarjeta encoge brevemente (scale: 0.98) como feedback táctil
  Y los tiers agotados no ejecutan ninguna animación de interacción
```

#### Subtasks

**DEV**
- [ ] Crear componente `TicketTier/TicketTier.tsx` con props: `title`, `description`, `price`, `status`, `tag?`, `selected?`, `onClick?`, `disabled?`
- [ ] Implementar lógica de estado `selectedTier` en `EventDetail.tsx` o en un hook dedicado
- [ ] Aplicar clases CSS condicionales para los tres estados: selected / available / disabled
- [ ] Renderizar `CheckCircle2` (lucide-react) condicionalmente cuando `selected === true`
- [ ] Aplicar `whileHover` y `whileTap` de Framer Motion solo cuando `!disabled`
- [ ] Inicializar selección con el primer tier disponible al cargar

**QA**
- [ ] Verificar que solo un tier puede estar seleccionado a la vez
- [ ] Verificar que hacer clic en un tier agotado no cambia la selección
- [ ] Verificar estado visual de los tres estados con contraste adecuado
- [ ] Verificar que el CheckCircle2 aparece y desaparece correctamente al cambiar selección
- [ ] Verificar que animaciones de hover/tap solo ocurren en tiers disponibles
- [ ] Verificar que el primer tier disponible está preseleccionado al cargar la página

---

### HU-FE-11: Panel sticky de reserva con CTA principal — SP: 3

Como **Comprador**
Quiero que el panel de selección de tickets permanezca visible mientras hago scroll por la información del evento
Para reservar en cualquier momento sin tener que volver al inicio de la página

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** Panel sticky en columna lateral (desktop) con botón de reserva primario. Integra validación de tier seleccionado, animación del botón CTA, política de reembolso y navegación al flujo de reserva (ms-ticketing). Complejidad media por interacción entre columnas y estado.

#### Criterios de Aceptación

**CA-01. Panel sticky visible durante el scroll en desktop**
```gherkin
Escenario: Panel de tickets sticky en desktop
  Dado que el comprador está en la vista de detalle en un viewport >= 1024px
  Cuando hace scroll hacia abajo por la sección de información del evento
  Entonces el panel de selección de tickets permanece fijo en la columna derecha (sticky top-28)
  Y el panel es visible durante todo el recorrido de lectura del evento
```

**CA-02. Botón "Reservar" habilitado solo cuando hay un tier seleccionado**
```gherkin
Escenario: Estado del botón en función de la selección
  Dado que el comprador está en el panel de tickets
  Cuando no tiene ningún tier seleccionado
  Entonces el botón "Reservar" aparece deshabilitado o con estado neutro
  Cuando selecciona un tier disponible
  Entonces el botón "Reservar" se activa con estilo primary-gradient
```

**CA-03. Botón "Reservar" navega a la pantalla de Checkout**
```gherkin
Escenario: Clic en botón Reservar con tier seleccionado
  Dado que el comprador tiene un tier seleccionado en el panel
  Cuando hace clic en el botón "Reservar"
  Entonces el estado de pantalla cambia a 'checkout'
  Y el comprador ve la pantalla "Finalizar Reserva" con el tier y evento seleccionados
  Y el temporizador de reserva (09:59) inicia en el navbar
```

> **Nota técnica:** La llamada a `POST /api/v1/reservations` (ms-ticketing) ocurre en la pantalla de Checkout al hacer clic en "Continuar al Pago", no aquí. Ver HU-FE-15 en `checkout-pago-frontend.md`.

**CA-04. Animación del botón "Reservar"**
```gherkin
Escenario: Feedback de interacción en el botón CTA
  Dado que el botón "Reservar" está habilitado
  Cuando el comprador hace hover sobre él
  Entonces el botón escala a 1.02
  Cuando hace clic
  Entonces el botón encoge a 0.98 como feedback táctil
```

**CA-05. Mensaje de política de reembolso bajo el botón**
```gherkin
Escenario: Información de garantía visible en el panel
  Dado que el panel de tickets está visible
  Cuando el comprador lo visualiza
  Entonces se muestra el texto "Garantía de reembolso hasta 48h antes" bajo el botón de reserva
  Y el texto tiene estilo discreto (uppercase, tracking-widest, color on-surface-variant con opacidad baja)
```

**CA-06. Panel ocupa ancho completo en mobile**
```gherkin
Escenario: Layout del panel en dispositivos móviles
  Dado que el comprador accede desde mobile (< 1024px)
  Cuando visualiza la vista de detalle del evento
  Entonces el panel de tickets se muestra debajo de la columna de información del evento
  Y ocupa el ancho completo de la pantalla
  Y no es sticky (el comportamiento sticky solo aplica en desktop)
```

#### Subtasks

**DEV**
- [ ] Implementar layout `grid-cols-1 lg:grid-cols-12` con columna izquierda 7-col y derecha 5-col
- [ ] Aplicar `sticky top-28` al contenedor del panel en la columna derecha
- [ ] Implementar botón `Reservar` con `motion.button` (whileHover, whileTap) e ícono `ArrowRight`
- [ ] Conectar el botón con la acción de reserva en `useReservation.ts` o handler en `EventDetail.tsx`
- [ ] Mostrar estado de carga en el botón durante la petición de reserva
- [ ] Agregar texto de política de reembolso como elemento visual estático al pie del panel

**QA**
- [ ] Verificar comportamiento sticky en desktop durante el scroll
- [ ] Verificar que en mobile el panel pierde el sticky y se apila bajo la columna de información
- [ ] Verificar que el botón refleja el estado correcto (habilitado / cargando / deshabilitado)
- [ ] Verificar que el ícono ArrowRight es visible dentro del botón
- [ ] Verificar que el texto de reembolso es legible y no distrae del CTA principal

---

### HU-FE-12: Barra de navegación inferior con ítem Profile — SP: 1

Como **Comprador en dispositivo móvil**
Quiero acceder a Explorar, Venues, mi proceso de Pago y mi Perfil desde la barra de navegación inferior
Para navegar entre las secciones principales y seguir mi compra con una sola mano

**Prioridad:** Media
**Estimación:** 1 SP
**Justificación SP:** Extensión de HU-FE-06. Reemplaza el ítem "Tickets" por "Payment" (CreditCard) dado que el flujo de pago es el punto de mayor valor transaccional.

**Depende de:** HU-FE-06 (bottom nav de 3 ítems)

#### Criterios de Aceptación

**CA-01. Bottom nav con cuatro ítems: Explore, Venues, Payment, Profile**
```gherkin
Escenario: Bottom nav con cuatro ítems
  Dado que el comprador accede desde mobile (< 768px)
  Cuando la barra de navegación inferior se renderiza
  Entonces se muestran cuatro ítems: Explore (Search), Venues (MapPin), Payment (CreditCard), Profile (User)
  Y cada ítem tiene un ícono de lucide-react y un label en uppercase
```

**CA-02. Estado activo según la pantalla actual del flujo**
```gherkin
Escenario: Indicador de ítem activo sincronizado con el estado de pantalla
  Dado que el comprador está navegando en el flujo de la aplicación
  Cuando la pantalla activa es 'catalog'
  Entonces el ítem Explore se muestra en color primary (activo)
  Cuando la pantalla es 'checkout', 'payment' o 'failure'
  Entonces el ítem Payment se muestra en color primary (activo)
  Cuando la pantalla es 'success'
  Entonces el ítem Profile se muestra en color primary (activo)
  Y los ítems inactivos se muestran en color on-surface-variant con opacidad 60%
```

**CA-03. Ítem Profile activo en pantalla de éxito**
```gherkin
Escenario: Profile activo en la confirmación de compra
  Dado que el comprador llega a la pantalla de confirmación exitosa
  Cuando la barra inferior se renderiza
  Entonces el ítem Profile se activa (color primary) dado que la confirmación se asocia a la cuenta
```

#### Subtasks

**DEV**
- [ ] Actualizar `NavBar.tsx` o el componente `BottomNav` con los cuatro ítems: Explore, Venues, Payment, Profile
- [ ] Usar ícono `CreditCard` (lucide-react) para el ítem Payment
- [ ] Recibir prop `activeTab: string` en el componente para aplicar el estado activo
- [ ] Mapear estado de pantalla a activeTab: `catalog` → 'explore', `checkout|payment|failure` → 'payment', `success` → 'profile'

**QA**
- [ ] Verificar que la bottom nav muestra exactamente 4 ítems: Explore, Venues, Payment, Profile
- [ ] Verificar que Payment (CreditCard) se activa durante checkout/pago/fallo
- [ ] Verificar que Profile se activa en la pantalla de éxito
- [ ] Verificar que los cuatro ítems están equiespaciados y no se superponen en 320px
- [ ] Verificar que la bottom nav sigue oculta en desktop (>= 768px)
