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
- [ ] Implementar búsqueda reactiva (filtrado client-side en tiempo real)
- [ ] Implementar estado de carga (skeleton o spinner)
- [ ] Implementar estado de error con mensaje descriptivo
- [ ] Implementar estado vacío cuando no hay resultados
- [ ] Registrar la ruta `/` o `/eventos` en el entrypoint de rutas
- [ ] Configurar `VITE_API_URL` en `.env`

**QA**
- [ ] Verificar carga inicial muestra todos los eventos publicados del backend
- [ ] Verificar búsqueda filtra correctamente (mayúsculas/minúsculas)
- [ ] Verificar mensaje de estado vacío al no encontrar resultados
- [ ] Verificar botón "Reservar" deshabilitado para eventos AGOTADO
- [ ] Verificar indicador de carga mientras la petición está en vuelo
- [ ] Verificar mensaje de error al simular fallo del API
- [ ] Verificar layout responsivo en mobile (1 columna, menú hamburguesa)
- [ ] Verificar menú mobile se abre y cierra correctamente

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
- [ ] Integrar estado de filtros activos en `useEvents` o en estado local de `Cartelera`
- [ ] Aplicar lógica de filtrado combinada (búsqueda + tier + fecha) sobre los eventos
- [ ] Pasar filtros activos como query params a `GET /api/v1/events` si el backend los soporta

**QA**
- [ ] Verificar filtro TIER muestra solo eventos con ese tier disponible
- [ ] Verificar filtro FECHA acota resultados al rango correcto
- [ ] Verificar combinación de búsqueda + tier + fecha funciona simultáneamente
- [ ] Verificar que limpiar filtros restaura la lista completa
