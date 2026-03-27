# Requerimiento: Cartelera — Vista de Eventos (Frontend)

## Contexto del feature

Implementación de la vista principal de cartelera en el frontend de SEM7. El comprador accede a esta página para explorar los eventos publicados, filtrar por tier o fecha y navegar hacia la reserva. El backend (ms-events, HU-03) ya expone el endpoint `GET /api/v1/events`; este requerimiento cubre exclusivamente la capa de presentación.

**Capa afectada:** `frontend/`
**Depende de:** HU-03 (ms-events — listado de eventos), HU-01, HU-02
**Stack:** React · TypeScript · CSS Modules · Vite · Axios · React Router
**Diseño de referencia:** Teatro Noir (fondo oscuro, acento salmon/naranja, tipografía serif en mayúsculas)

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

### HU-FE-01: Vista Cartelera — Listado de eventos con búsqueda — SP: 5

Como **Comprador**
Quiero ver la cartelera con todos los eventos publicados y poder buscar por nombre
Para encontrar rápidamente el evento que me interesa y conocer su disponibilidad antes de reservar

**Prioridad:** Alta
**Estimación:** 5 SP
**Justificación SP:** Vista principal del producto. Requiere integración HTTP con api-gateway, manejo de estados de carga/error/vacío, búsqueda reactiva en tiempo real, renderizado condicional por disponibilidad y diseño responsivo con mobile menu animado.

#### Criterios de Aceptación

**CA-01. Cartelera carga y muestra eventos publicados**
```gherkin
Escenario: Carga inicial de la cartelera
  Dado que el comprador abre la página principal de cartelera
  Cuando la vista termina de cargar
  Entonces se muestra la grilla con todos los eventos publicados obtenidos de GET /api/v1/events
  Y cada tarjeta muestra el título, fecha, venue, imagen y badge de estado (DISPONIBLE / AGOTADO)
  Y los eventos con status DISPONIBLE muestran el botón "Reservar" habilitado
  Y los eventos con status AGOTADO muestran "Sold Out" deshabilitado
```

**CA-02. Búsqueda en tiempo real por nombre de evento**
```gherkin
Escenario: Filtrado por nombre
  Dado que el comprador está en la cartelera con eventos cargados
  Cuando escribe texto en el campo de búsqueda
  Entonces la grilla filtra en tiempo real y muestra solo los eventos cuyo título contiene el texto ingresado (case-insensitive)
  Y si ningún evento coincide se muestra el mensaje "No se encontraron eventos que coincidan con tu búsqueda."
```

**CA-03. Estado vacío por búsqueda sin resultados**
```gherkin
Escenario: Búsqueda sin resultados
  Dado que el comprador escribe un texto que no coincide con ningún evento
  Cuando la lista filtrada queda vacía
  Entonces se muestra un mensaje de estado vacío centrado en la página
  Y no se muestra ninguna tarjeta de evento
```

**CA-04. Estado de carga mientras se obtienen eventos**
```gherkin
Escenario: Indicador de carga
  Dado que el comprador abre la cartelera
  Cuando la petición a la API aún no ha respondido
  Entonces se muestra un indicador de carga visible en pantalla
  Y la grilla de eventos no se renderiza hasta que la respuesta sea exitosa
```

**CA-05. Estado de error al fallar la carga de eventos**
```gherkin
Escenario: Error en la carga de eventos
  Dado que la petición a GET /api/v1/events devuelve un error (4xx o 5xx)
  Cuando el comprador está en la cartelera
  Entonces se muestra un mensaje de error descriptivo
  Y la grilla de eventos no se muestra
```

#### Subtasks

**DEV**
- [ ] Crear página `pages/Cartelera.tsx` con estructura de layout (nav, hero, filtros, grilla, footer)
- [ ] Crear servicio `services/eventService.ts` con función `getEvents(params)` usando Axios hacia api-gateway
- [ ] Crear hook `hooks/useEvents.ts` con estados: `events`, `loading`, `error`
- [ ] Crear componente `components/EventCard/EventCard.tsx` con imagen, badge de estado, título, metadata, botón
- [ ] Crear componente `components/NavBar/NavBar.tsx` con logo, links y iconos de acción
- [ ] Crear componente `components/FilterBar/FilterBar.tsx` con input de búsqueda y dropdowns (TIER, FECHA)
- [ ] Implementar búsqueda reactiva con `useState` (filtrado client-side en tiempo real)
- [ ] Implementar estado de carga (skeleton o spinner)
- [ ] Implementar estado de error con mensaje descriptivo
- [ ] Implementar estado vacío cuando no hay resultados
- [ ] Registrar la ruta `/` o `/eventos` en el entrypoint de rutas
- [ ] Configurar `VITE_API_URL` en `.env`
- [ ] _(Pendiente)_ Implementar menú hamburguesa mobile con íconos `Menu` / `X` (lucide-react) para mostrar/ocultar nav links en viewport < 768px

**QA**
- [ ] Verificar carga inicial muestra todos los eventos publicados del backend
- [ ] Verificar búsqueda filtra correctamente (mayúsculas/minúsculas)
- [ ] Verificar mensaje de estado vacío al no encontrar resultados
- [ ] Verificar botón "Reservar" deshabilitado para eventos AGOTADO
- [ ] Verificar indicador de carga mientras la petición está en vuelo
- [ ] Verificar mensaje de error al simular fallo del API
- [ ] Verificar layout responsivo en mobile (1 columna)
- [ ] Verificar menú hamburguesa abre y cierra los links de navegación en mobile

---

### HU-FE-02: Filtros de tier y fecha en la cartelera — SP: 3

Como **Comprador**
Quiero filtrar los eventos de la cartelera por tier (VIP, General, Early Bird) y por fecha
Para acotar la selección según mis preferencias económicas y mi disponibilidad de tiempo

**Prioridad:** Media
**Estimación:** 3 SP
**Justificación SP:** Extiende la funcionalidad de HU-FE-01 con lógica de filtrado adicional en el cliente y/o query params al backend. Complejidad baja-media.

#### Criterios de Aceptación

**CA-01. Filtro por tier**
```gherkin
Escenario: Filtrado por tier
  Dado que el comprador está en la cartelera con eventos cargados
  Cuando selecciona un tier del dropdown "TIER" (ej. VIP)
  Entonces la grilla muestra solo los eventos que tienen disponibilidad en ese tier
  Y si ningún evento coincide se muestra el estado vacío
```

**CA-02. Filtro por fecha**
```gherkin
Escenario: Filtrado por rango de fecha
  Dado que el comprador está en la cartelera
  Cuando selecciona una opción del dropdown "FECHA" (ej. Esta semana, Este mes)
  Entonces la grilla muestra solo los eventos cuya fecha cae dentro del rango seleccionado
```

**CA-03. Combinación de filtros**
```gherkin
Escenario: Filtros combinados con búsqueda
  Dado que el comprador tiene activo un filtro de tier y ha escrito texto en el buscador
  Cuando la grilla se actualiza
  Entonces solo se muestran los eventos que cumplen ambas condiciones simultáneamente
```

**CA-04. Limpiar filtros**
```gherkin
Escenario: Restablecer filtros
  Dado que el comprador tiene varios filtros activos
  Cuando restablece los filtros a su valor por defecto
  Entonces la grilla vuelve a mostrar todos los eventos publicados sin filtrar
```

#### Subtasks

**DEV**
- [ ] Extender `FilterDropdown` con opciones de selección para TIER y FECHA
- [ ] Agregar ícono `ChevronDown` (lucide-react) como indicador visual del dropdown de TIER, posicionado en el borde derecho del campo
- [ ] Integrar estado de filtros activos en `useEvents` o en estado local de `Cartelera`
- [ ] Aplicar lógica de filtrado combinada (búsqueda + tier + fecha) sobre los eventos
- [ ] Pasar filtros activos como query params a `GET /api/v1/events` si el backend los soporta

**QA**
- [ ] Verificar filtro TIER muestra solo eventos con ese tier disponible
- [ ] Verificar filtro FECHA acota resultados al rango correcto
- [ ] Verificar combinación de búsqueda + tier + fecha funciona simultáneamente
- [ ] Verificar que limpiar filtros restaura la lista completa
- [ ] Verificar que el ícono ChevronDown se muestra en el dropdown de TIER y no es interactivo (pointer-events-none)

---

### HU-FE-03: Grilla bento con jerarquía visual de tarjetas — SP: 3

Como **Comprador**
Quiero ver la cartelera organizada en una grilla bento con tarjeta destacada, tarjeta secundaria y tarjetas regulares
Para percibir de forma inmediata qué evento es el principal y explorar el resto con una lectura visual natural

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** Implica tres variantes de componente `EventCard` (featured 8-col, tall 4-col, regular 4-col) con composición de imagen, gradiente y datos superpuestos. Requiere animaciones de hover (`whileHover: scale`) con Framer Motion y efecto escala de grises → color en tarjetas regulares.

#### Criterios de Aceptación

**CA-01. Tarjeta destacada muestra el primer evento con layout hero**
```gherkin
Escenario: Renderizado de tarjeta destacada (featured)
  Dado que el comprador carga la cartelera con al menos un evento publicado
  Cuando la grilla bento se renderiza
  Entonces el primer evento ocupa la posición hero (8 columnas en desktop)
  Y la tarjeta muestra la imagen a pantalla completa con gradiente from-surface
  Y se muestran: badge de etiqueta, fecha, título (tipografía grande), venue con ícono MapPin y precio con label "Starting from"
  Y al hacer hover la tarjeta escala sutilmente y la imagen hace zoom
```

**CA-02. Tarjeta secundaria (tall) ocupa columna lateral**
```gherkin
Escenario: Renderizado de tarjeta tall
  Dado que la grilla bento está visible
  Cuando se renderiza el segundo evento
  Entonces ocupa 4 columnas en desktop con la misma altura que la tarjeta featured (h-[500px])
  Y muestra fecha, título, venue y precio alineados sobre el gradiente de la imagen
```

**CA-03. Tarjetas regulares muestran efecto escala de grises**
```gherkin
Escenario: Efecto hover en tarjetas regulares
  Dado que la cartelera muestra tres o más eventos adicionales en formato regular
  Cuando el comprador posiciona el cursor sobre una tarjeta regular
  Entonces la imagen pasa de escala de grises al color completo con transición suave (700 ms)
  Y la tarjeta escala ligeramente (scale 1.02)
  Y si el evento tiene etiqueta se muestra en color primary sobre la tarjeta
```

**CA-04. Layout responsivo de la grilla bento**
```gherkin
Escenario: Adaptación de la grilla en mobile
  Dado que el comprador accede desde un dispositivo móvil
  Cuando la cartelera se renderiza
  Entonces todas las tarjetas se apilan en una sola columna (col-span-1)
  Y se mantiene el orden: featured → tall → regulares
```

**CA-05. Animación de entrada escalonada de las tarjetas**
```gherkin
Escenario: Tarjetas aparecen de forma secuencial al cargar la cartelera
  Dado que el comprador abre la cartelera por primera vez
  Cuando la grilla de eventos se monta
  Entonces cada tarjeta aparece con animación de fade-in y scale (0.95 → 1)
  Y las tarjetas aparecen de forma escalonada con un delay proporcional a su posición (ej. 0s, 0.1s, 0.2s...)
  Y la animación se ejecuta una sola vez al montar la vista
```

#### Subtasks

**DEV**
- [ ] Crear componente único `EventCard/EventCard.tsx` con prop `isFeatured?: boolean` para renderizado condicional del layout (8-col featured / 4-col resto)
- [ ] Aplicar lógica de altura por índice: tarjeta featured e índice 0/1 → h-[500px]; tarjetas índice ≥ 2 → h-[400px] en desktop
- [ ] Agregar `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}` en `motion.div` de cada tarjeta
- [ ] Integrar `motion.div` con `whileHover={{ scale: 1.02 }}` para hover en todas las variantes
- [ ] Definir breakpoints CSS para colapso a 1 columna en mobile
- [ ] Usar `isFeatured` (boolean) como nombre canónico del campo en la interfaz TypeScript `Event`

**QA**
- [ ] Verificar orden y proporciones de la grilla en desktop (1200px+)
- [ ] Verificar colapso a 1 columna en mobile (< 768px)
- [ ] Verificar que la animación de entrada escalonada ocurre al montar la vista
- [ ] Verificar que el delay se incrementa visiblemente entre tarjetas contiguas
- [ ] Verificar que el hover scale no genera scroll horizontal
- [ ] Verificar que imagen, degradado y texto se leen correctamente en cada variante

---

### HU-FE-04: Etiquetas y badges de estado en tarjetas de evento — SP: 1

Como **Comprador**
Quiero ver etiquetas visuales en las tarjetas de evento (ej. "Featured Performance", "LIMITED SEATING")
Para identificar de inmediato los eventos con características especiales sin necesidad de abrir el detalle

**Prioridad:** Media
**Estimación:** 1 SP
**Justificación SP:** Componente visual simple que depende de un campo opcional `tag` en la respuesta del evento. Sin lógica de negocio adicional.

#### Criterios de Aceptación

**CA-01. Badge relleno para la etiqueta de evento destacado**
```gherkin
Escenario: Evento con etiqueta "FEATURED PERFORMANCE"
  Dado que el backend devuelve el primer evento con campo tag = "FEATURED PERFORMANCE"
  Cuando la tarjeta featured se renderiza
  Entonces se muestra un badge con fondo primary y texto en color surface (oscuro) en mayúsculas
  Y el badge se posiciona en la sección inferior izquierda de la tarjeta, junto a la fecha
```

**CA-02. Badge outlined para etiquetas de eventos regulares**
```gherkin
Escenario: Evento con etiqueta "LIMITED SEATING"
  Dado que un evento regular tiene campo tag = "LIMITED SEATING"
  Cuando la tarjeta regular se renderiza
  Entonces se muestra el tag como badge con borde primary/30 y texto primary en uppercase (sin fondo relleno)
  Y el badge se posiciona encima del título en la sección inferior de la tarjeta
```

> **Regla de negocio:** El estilo del badge varía según el tipo de tag: `FEATURED PERFORMANCE` usa estilo **filled** (fondo sólido primary); cualquier otra etiqueta usa estilo **outlined** (borde + texto primary, sin relleno).

**CA-03. Eventos sin etiqueta no muestran badge**
```gherkin
Escenario: Evento sin tag
  Dado que el backend devuelve un evento sin campo tag (null o vacío)
  Cuando la tarjeta se renderiza
  Entonces no se muestra ningún badge ni espacio en blanco reservado para el tag
```

**CA-04. Badge `isLimited` para eventos con aforo reducido**
```gherkin
Escenario: Evento con bandera isLimited = true
  Dado que el backend devuelve un evento con campo `isLimited = true`
  Cuando la tarjeta del evento se renderiza
  Entonces se muestra un badge con texto "Limited Seating" con fondo surface-high y texto on-surface
  Y el badge es independiente del campo `tag` (pueden coexistir ambos)
  Y si `isLimited = false` o es null, el badge no se muestra
```

> **Regla de negocio:** `isLimited` es un boolean independiente de `tag`. Permite a los administradores marcar un aforo reducido sin reemplazar la etiqueta editorial del evento.

#### Subtasks

**DEV**
- [ ] Agregar campo opcional `tag?: string` en la interfaz `EventResponse` del frontend
- [ ] Agregar campo opcional `isLimited?: boolean` en la interfaz `EventResponse` del frontend
- [ ] Renderizar badge de tag condicionalmente en `EventCard` (filled para FEATURED, outlined para otros)
- [ ] Renderizar badge "Limited Seating" condicionalmente cuando `isLimited === true`

**QA**
- [ ] Verificar que badge de tag solo aparece cuando el campo tag tiene valor
- [ ] Verificar estilos: fondo primary + texto surface para FEATURED; borde primary + texto primary para otros
- [ ] Verificar que badge "Limited Seating" aparece solo cuando `isLimited = true`
- [ ] Verificar que ambos badges (tag + isLimited) pueden coexistir en la misma tarjeta
- [ ] Verificar que tarjetas sin tag ni isLimited no tienen espacio vacío

---

### HU-FE-05: Acciones de navegación — notificaciones, carrito y perfil de usuario — SP: 2

Como **Comprador autenticado**
Quiero ver accesos rápidos a notificaciones, carrito y mi perfil en la barra de navegación
Para gestionar mis tickets y alertas sin salir de la cartelera

**Prioridad:** Media
**Estimación:** 2 SP
**Justificación SP:** Elementos visuales del navbar que no requieren backend propio en esta fase, pero deben ser el punto de entrada para futuras funcionalidades (carrito y notificaciones). Incluye avatar con placeholder de imagen.

#### Criterios de Aceptación

**CA-01. Ícono de notificaciones en navbar**
```gherkin
Escenario: Ícono Bell visible en navbar
  Dado que el comprador está en cualquier página con la barra de navegación
  Cuando la navbar se renderiza
  Entonces se muestra el ícono Bell (lucide-react) en el área de acciones del navbar
  Y al hacer hover el ícono cambia a color primary con transición
```

**CA-02. Ícono de carrito en navbar**
```gherkin
Escenario: Ícono ShoppingCart visible en navbar
  Dado que el comprador está en cualquier página con la barra de navegación
  Cuando la navbar se renderiza
  Entonces se muestra el ícono ShoppingCart en el área de acciones del navbar
  Y al hacer hover el ícono cambia a color primary con transición
```

**CA-03. Avatar de perfil en navbar**
```gherkin
Escenario: Avatar del usuario visible en navbar
  Dado que la navbar se renderiza
  Cuando el componente se monta
  Entonces se muestra un avatar circular (32x32px) con imagen del perfil del usuario
  Y si la imagen no carga se mantiene el contenedor con borde visible
```

**CA-04. Navbar oculta sus acciones en modo transaccional**
```gherkin
Escenario: Navbar sin acciones en el flujo de checkout y pago
  Dado que el comprador entra a la pantalla de checkout, pago, éxito o fallo
  Cuando el navbar se renderiza
  Entonces los íconos Bell, ShoppingCart y el avatar NO se muestran
  Y los links de navegación (Events, Venues, My Tickets) NO se muestran
  Y en su lugar se muestra el temporizador de reserva (ver HU-FE-14 en checkout-pago-frontend.md)
```

> **Regla de negocio:** Bell, ShoppingCart y avatar pertenecen exclusivamente al modo de navegación estándar. En pantallas transaccionales el navbar pasa a modo reducido con timer. Ver HU-FE-14 para la especificación completa del modo transaccional.

#### Subtasks

**DEV**
- [ ] Agregar íconos `Bell`, `ShoppingCart` en `NavBar.tsx` usando elementos `<button>` (no `<div>`) para accesibilidad
- [ ] Aplicar `hover:text-primary transition-colors` en los botones de Bell y ShoppingCart
- [ ] Agregar componente de avatar con `<img>` protegido con `referrerPolicy="no-referrer"`
- [ ] Recibir prop `isTransactional: boolean` en el navbar para ocultar/mostrar acciones
- [ ] Marcar íconos como placeholders para futura integración con notificaciones y carrito

**QA**
- [ ] Verificar íconos visibles en navbar en desktop y tablet (modo normal)
- [ ] Verificar efecto hover color primary en Bell y ShoppingCart
- [ ] Verificar que los botones son focusables y activables por teclado (accesibilidad)
- [ ] Verificar que avatar se renderiza sin error de consola
- [ ] Verificar que Bell, ShoppingCart y avatar NO aparecen en checkout/pago/éxito/fallo
- [ ] Verificar que los links de nav NO aparecen en modo transaccional

---

### HU-FE-06: Navegación inferior en dispositivos móviles — SP: 2

Como **Comprador en dispositivo móvil**
Quiero ver una barra de navegación inferior fija con accesos a las secciones principales
Para navegar entre Explorar, Venues y Mis Tickets con una sola mano

**Prioridad:** Alta
**Estimación:** 2 SP
**Justificación SP:** Reemplaza el menú hamburguesa mencionado en HU-FE-01 por un patrón de bottom navigation más accesible en móvil. Componente simple con tres ítems y estado activo.

#### Criterios de Aceptación

**CA-01. Bottom nav visible solo en mobile**
```gherkin
Escenario: Bottom nav en viewport móvil
  Dado que el comprador accede desde un dispositivo con pantalla menor a 768px
  Cuando cualquier página con navegación se renderiza
  Entonces se muestra una barra fija en la parte inferior con tres ítems: Explore, Venues, Tickets
  Y la barra tiene fondo con backdrop-blur y borde superior sutil
```

**CA-02. Bottom nav oculto en desktop**
```gherkin
Escenario: Bottom nav en viewport desktop
  Dado que el comprador accede desde un dispositivo con pantalla >= 768px
  Cuando la página se renderiza
  Entonces la barra de navegación inferior no es visible (display: hidden en md+)
  Y la navegación superior (navbar) es la única visible
```

**CA-03. Estado activo en ítem seleccionado**
```gherkin
Escenario: Indicador de sección activa
  Dado que el comprador está navegando en la sección "Explore"
  Cuando la barra inferior se renderiza
  Entonces el ícono y label de "Explore" se muestran en color primary
  Y los demás ítems (Venues, Tickets) se muestran en color on-surface-variant
```

#### Subtasks

**DEV**
- [ ] Crear o actualizar `NavBar.tsx` con sección `<nav className="md:hidden fixed bottom-0 ...">` 
- [ ] Incluir íconos `Search`, `MapPin`, `Ticket` (lucide-react) con label en cada ítem
- [ ] Implementar lógica de estado activo basada en la ruta actual (`useLocation` de React Router)

**QA**
- [ ] Verificar que la bottom nav NO aparece en desktop (>= 768px)
- [ ] Verificar que sí aparece y es fija en mobile (< 768px)
- [ ] Verificar indicador de ítem activo cambia al navegar entre secciones
- [ ] Verificar que la bottom nav no tapa contenido inferior de la página (padding en main)

---

### HU-FE-07: Paginación con botón "Load More" en la cartelera — SP: 2

Como **Comprador**
Quiero poder cargar más eventos desde la cartelera haciendo clic en un botón "Load More"
Para explorar el catálogo completo de forma progresiva sin sobrecargar la carga inicial

**Prioridad:** Media
**Estimación:** 2 SP
**Justificación SP:** Lógica de paginación en el hook `useEvents` con parámetro `page` o `offset`. Interacción con el botón y actualización incremental de la lista sin reemplazar los ya cargados.

#### Criterios de Aceptación

**CA-01. Botón "Load More" visible cuando hay más eventos por cargar**
```gherkin
Escenario: Más eventos disponibles en el servidor
  Dado que la cartelera carga una página inicial de eventos
  Cuando el servidor indica que existen más eventos (ej. respuesta con paginación)
  Entonces se muestra el botón "Load More Performances" centrado debajo de la grilla
  Y el botón tiene estilo primario con animación de hover (scale 1.05) y tap (scale 0.95)
```

**CA-02. Carga de página adicional al hacer clic**
```gherkin
Escenario: Clic en Load More
  Dado que el comprador ve el botón "Load More Performances"
  Cuando hace clic en él
  Entonces se realiza una nueva petición a GET /api/v1/events con el siguiente parámetro de página
  Y los nuevos eventos se agregan a la grilla existente (sin reemplazar los actuales)
  Y el botón muestra un estado de carga mientras la petición está en vuelo
```

**CA-03. Botón oculto cuando no hay más eventos**
```gherkin
Escenario: Todos los eventos ya fueron cargados
  Dado que la respuesta del servidor indica que no hay más páginas
  Cuando la grilla se actualiza con la última página
  Entonces el botón "Load More Performances" desaparece o se deshabilita
```

#### Subtasks

**DEV**
- [ ] Agregar lógica de paginación a `useEvents.ts` (estado `page`, función `loadMore`, flag `hasMore`)
- [ ] Actualizar `eventService.ts` para aceptar parámetro `page` en `GET /api/v1/events`
- [ ] Renderizar el botón condicionalmente según `hasMore`
- [ ] Mostrar estado de carga en el botón mientras se ejecuta `loadMore`

**QA**
- [ ] Verificar que los eventos nuevos se agregan sin reemplazar los anteriores
- [ ] Verificar que el botón desaparece cuando `hasMore = false`
- [ ] Verificar que el botón muestra loading mientras la petición está en vuelo
- [ ] Verificar que un error en Load More no limpia los eventos ya cargados
