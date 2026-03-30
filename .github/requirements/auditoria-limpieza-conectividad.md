# Requerimiento: Auditoría de Limpieza, Conectividad y Funcionalidad

## Contexto del feature

Tras una auditoría completa del proyecto SEM7 (frontend y backend), se identificaron problemas de conectividad, código muerto, lógica hardcodeada y vistas desconectadas del backend. Este requerimiento agrupa todas las correcciones necesarias para estabilizar el producto antes de futuras iteraciones.

### Problemas detectados

1. **VenuesPage (403 Forbidden):** La vista de venues llama a `GET /api/v1/rooms` sin enviar el header `X-Role: ADMIN`. El `RoomController` en ms-events exige ese header, provocando un 403 que impide cargar la página. Un comprador público no debería necesitar rol ADMIN para ver los venues.

2. **MyTicketsPage desconectada del backend:** La página "Mis Tickets" lee exclusivamente de `localStorage` (`ticketsStorage.ts`). El backend expone `GET /api/v1/tickets` en ms-ticketing pero el frontend no lo consume. Si el usuario limpia el navegador o accede desde otro dispositivo, pierde sus tickets.

3. **Cantidad de entradas hardcodeada:** El flujo de compra fija `quantity = 2` en `EventDetail.tsx`, `CheckoutScreen.tsx`, `OrderSummary.tsx` y `PaymentPanel.tsx`. No existe ningún input para que el comprador seleccione cuántas entradas desea adquirir.

4. **VenuesPage usa `fetch()` nativo:** A diferencia del resto del frontend que usa Axios, VenuesPage utiliza `fetch()` directamente, rompiendo la consistencia del client HTTP y la capa de servicios.

5. **Botón de reintento en notificación de pago rechazado:** Cuando el comprador recibe una notificación de pago rechazado en el panel de notificaciones, no hay forma de volver al flujo de pago desde allí. Se necesita un botón de acción dentro de la notificación.

**Capas afectadas:** `frontend/`, `ms-events/` (backend)
**Depende de:** HU-04 (ms-ticketing — reservas), HU-FE-13 (flujo de checkout), HU-NTF (notificaciones in-app)
**Stack Frontend:** React · TypeScript · CSS Modules · Vite · Axios · React Router
**Stack Backend:** Java 17+ · Spring Boot 3.x · PostgreSQL

---

## Escala de estimación
Fibonacci: 1, 2, 3, 5, 8, 13

## Definition of Ready (DoR)
- Formato Como / Quiero / Para redactado correctamente
- Valor de negocio identificable y claro
- Criterios de aceptación definidos en Gherkin
- Estimación en Story Points asignada

## Definition of Done (DoD)
- Formato Como / Quiero / Para completo y claro
- Criterios de aceptación escritos en Gherkin declarativo
- Escenarios cubren el camino feliz y los casos alternos o límite
- Tasking desglosado desde la perspectiva DEV y QA
- Estimación en Story Points asignada y justificada
- Commit atómico subido al repositorio con mensaje descriptivo

---

## Historias de Usuario

### HU-AUD-01: Endpoint público de listado de rooms (venues) — SP: 3

Como **Comprador**
Quiero poder ver la lista de venues sin necesidad de autenticarme como administrador
Para explorar los escenarios disponibles y sus eventos próximos desde la vista pública de venues

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** Requiere crear un endpoint público nuevo en ms-events (`GET /api/v1/rooms/public`) que no exija `X-Role: ADMIN`, refactorizar `VenuesPage` para usar un servicio Axios en vez de `fetch()` nativo, y migrar la lógica de fetch dentro de la capa de servicios del frontend.

#### Criterios de Aceptación

**CA-01. Endpoint público de rooms disponible sin autenticación**
```gherkin
Escenario: Listado público de venues sin header de rol
  Dado que ms-events está en ejecución
  Y el API Gateway enruta `/api/v1/rooms/public/**` hacia ms-events
  Cuando el frontend envía GET /api/v1/rooms/public sin headers de autenticación
  Entonces el backend responde con status 200
  Y el body contiene un array de rooms con id, name y maxCapacity
```

**CA-02. Ruta expuesta a través del API Gateway**
```gherkin
Escenario: Gateway redirige peticiones de rooms públicas
  Dado que el API Gateway está en ejecución
  Cuando el frontend envía GET /api/v1/rooms/public al puerto 8080
  Entonces el gateway redirige la petición a ms-events
  Y la respuesta se retorna al cliente sin modificaciones
```

**CA-03. VenuesPage usa el servicio Axios en vez de fetch nativo**
```gherkin
Escenario: Consistencia del client HTTP
  Dado que el comprador está en la vista de Venues
  Cuando la página carga datos de rooms y eventos
  Entonces las peticiones se realizan a través de un servicio en frontend/src/services/ usando Axios
  Y las peticiones se dirigen al API Gateway (VITE_API_URL)
  Y no se utiliza fetch() nativo en ningún componente
```

**CA-04. VenuesPage muestra los venues con eventos**
```gherkin
Escenario: Vista de Venues carga correctamente
  Dado que el comprador navega a /venues
  Cuando la página termina de cargar
  Entonces se muestran las tarjetas de venues con su nombre, ciudad, capacidad y descripción
  Y cada venue muestra la lista de eventos próximos asociados
  Y cada evento tiene un link a la vista de detalle (/eventos/:id)
```

**CA-05. Estado de error si la API no responde**
```gherkin
Escenario: Manejo de error en carga de venues
  Dado que el comprador navega a /venues
  Y el backend no está disponible o responde con error
  Cuando la petición falla
  Entonces se muestra un mensaje de error amigable
  Y no se muestra un error técnico ni una pantalla en blanco
```

#### Subtasks

**DEV Backend**
- [ ] Crear endpoint `GET /api/v1/rooms/public` en `RoomController` que no requiera `X-Role: ADMIN`
- [ ] Reutilizar `RoomService.getAllRooms()` en el nuevo endpoint
- [ ] Agregar ruta `/api/v1/rooms/public/**` en la configuración del API Gateway

**DEV Frontend**
- [ ] Crear `venueService.ts` en `frontend/src/services/` con funciones `getPublicRooms()` y reutilizar `getEvents()` de `eventService.ts`
- [ ] Refactorizar `VenuesPage.tsx` para usar `venueService` en vez de `fetch()` nativo
- [ ] Apuntar la llamada de rooms a `/api/v1/rooms/public`

**QA**
- [ ] Verificar que `GET /api/v1/rooms/public` responde 200 sin headers de autenticación
- [ ] Verificar que el endpoint ADMIN original `GET /api/v1/rooms` sigue requiriendo `X-Role: ADMIN`
- [ ] Verificar que la vista de Venues carga y muestra datos correctamente
- [ ] Verificar mensaje de error ante backend caído

---

### HU-AUD-02: Conectar MyTicketsPage al backend real (ms-ticketing) — SP: 5

Como **Comprador**
Quiero que la página "Mis Tickets" muestre mis tickets confirmados consultando el backend en vez de depender del almacenamiento local del navegador
Para no perder mis entradas si limpio el navegador o accedo desde otro dispositivo

**Prioridad:** Alta
**Estimación:** 5 SP
**Justificación SP:** Requiere crear un servicio HTTP nuevo (`ticketService.ts`), un hook de estado (`useMyTickets.ts`), refactorizar `MyTicketsPage` para consumir datos del API `GET /api/v1/tickets`, manejar estados de loading/error/vacío, y adaptar el modelo de datos del response de ms-ticketing al modelo visual existente (`StoredTicket`). El endpoint retorna datos reducidos (sin event metadata) por lo que es necesario enriquecer con información del evento.

#### Criterios de Aceptación

**CA-01. Tickets cargados desde el backend**
```gherkin
Escenario: Lista de tickets desde la API real
  Dado que el comprador navega a /mis-tickets
  Cuando la página termina de cargar
  Entonces se realiza una petición GET /api/v1/tickets con header X-User-Id
  Y se muestran los tickets confirmados (status VALID) del comprador
  Y cada ticket muestra tier, precio, evento y fecha de compra
```

**CA-02. Estado de carga mientras se obtienen tickets**
```gherkin
Escenario: Indicador de carga
  Dado que el comprador navega a /mis-tickets
  Cuando la petición al backend está en curso
  Entonces se muestra un indicador de carga (skeleton o spinner)
  Y no se muestra mensaje de "Aún no tienes tickets" durante la carga
```

**CA-03. Estado vacío cuando no hay tickets**
```gherkin
Escenario: Sin tickets comprados
  Dado que el comprador navega a /mis-tickets
  Y el backend retorna una lista vacía de tickets
  Cuando la carga completa
  Entonces se muestra el mensaje "Aún no tienes tickets"
  Y se muestra el botón "Explorar cartelera" que redirige a /eventos
```

**CA-04. Estado de error si la API falla**
```gherkin
Escenario: Error al cargar tickets
  Dado que el comprador navega a /mis-tickets
  Y el backend no responde o retorna error
  Cuando la petición falla
  Entonces se muestra un mensaje de error amigable
  Y se ofrece un botón para reintentar la carga
```

**CA-05. El header X-User-Id se envía en la petición**
```gherkin
Escenario: Identificación del comprador
  Dado que el comprador navega a /mis-tickets
  Cuando se envía la petición a GET /api/v1/tickets
  Entonces el header X-User-Id contiene el ID del comprador actual
  Y el backend retorna solo los tickets que pertenecen a ese comprador
```

#### Subtasks

**DEV Frontend**
- [ ] Crear `ticketService.ts` en `frontend/src/services/` con función `getMyTickets(buyerId)` que llame a `GET /api/v1/tickets` con header `X-User-Id`
- [ ] Crear hook `useMyTickets.ts` en `frontend/src/hooks/` que maneje loading, error, data
- [ ] Refactorizar `MyTicketsPage.tsx` para consumir `useMyTickets()` en vez de `getTickets()` de `ticketsStorage.ts`
- [ ] Adaptar el mapeo de `TicketResponse` (backend) al modelo visual que necesita `TicketCard`
- [ ] Agregar estados de loading (skeleton) y error con botón de retry
- [ ] Mantener `ticketsStorage.ts` como fallback opcional (si backend falla, mostrar los locales)

**QA**
- [ ] Verificar que GET /api/v1/tickets retorna los tickets del buyer a través del gateway
- [ ] Verificar que la vista muestra los tickets obtenidos de la API
- [ ] Verificar state de loading, vacío y error
- [ ] Verificar que si no hay tickets la UI muestra el estado vacío correcto

---

### HU-AUD-03: Selector de cantidad de entradas en el flujo de compra — SP: 5

Como **Comprador**
Quiero poder seleccionar cuántas entradas deseo comprar antes de proceder al checkout
Para adquirir múltiples entradas en una sola transacción sin estar limitado a una cantidad fija

**Prioridad:** Alta
**Estimación:** 5 SP
**Justificación SP:** Requiere un input numérico en el panel de selección de tier o en el checkout, propagar la cantidad seleccionada a lo largo de todo el flujo (TicketPanel → CheckoutScreen → OrderSummary → PaymentPanel → EventDetail.handleContinueToPayment), recalcular los totales dinámicamente, y validar que la cantidad no exceda la cuota disponible del tier.

#### Criterios de Aceptación

**CA-01. Selector de cantidad visible en el flujo de compra**
```gherkin
Escenario: Input de cantidad disponible
  Dado que el comprador está en la pantalla de detalle de evento
  Y ha seleccionado un tier disponible
  Cuando el panel de tickets está visible
  Entonces se muestra un selector numérico de cantidad con valor mínimo 1 y máximo según la cuota disponible del tier
  Y el valor por defecto es 1
```

**CA-02. Incremento y decremento de cantidad**
```gherkin
Escenario: Ajuste de cantidad con botones +/−
  Dado que el comprador tiene el selector de cantidad visible
  Cuando presiona el botón "+" para incrementar
  Entonces la cantidad aumenta en 1 hasta el máximo permitido
  Y cuando presiona el botón "−" para decrementar
  Entonces la cantidad disminuye en 1 hasta un mínimo de 1
```

**CA-03. Total recalculado dinámicamente**
```gherkin
Escenario: Cálculo dinámico del total
  Dado que el comprador ha seleccionado un tier con precio P
  Y ha seleccionado una cantidad Q
  Cuando se navega a la pantalla de checkout
  Entonces el subtotal muestra P × Q
  Y el total muestra (P × Q) + tarifa de servicio
  Y el resumen del pedido muestra "Qx TIER_TYPE"
```

**CA-04. Cantidad propagada a la pantalla de checkout y pago**
```gherkin
Escenario: Cantidad reflajeda en todo el flujo
  Dado que el comprador seleccionó 3 entradas VIP
  Cuando avanza por checkout → pago → resultado
  Entonces el OrderSummary muestra "3x VIP"
  Y el PaymentPanel calcula el total con quantity = 3
  Y la pantalla de pago muestra "Total de la reserva por 3 entradas VIP"
```

**CA-05. Validación de límite por cuota del tier**
```gherkin
Escenario: Cantidad no puede exceder cuota disponible
  Dado que el tier seleccionado tiene quota = 5
  Cuando el comprador intenta incrementar la cantidad a 6
  Entonces el botón "+" se deshabilita
  Y la cantidad se mantiene en 5
```

**CA-06. Cantidad guardada en localStorage con el ticket**
```gherkin
Escenario: Persistencia de cantidad en el ticket almacenado
  Dado que el comprador completó una compra con quantity = 3
  Cuando el ticket se guarda para la vista "Mis Tickets"
  Entonces el registro almacenado contiene quantity = 3
  Y la tarjeta en MyTicketsPage muestra "3 entradas"
```

#### Subtasks

**DEV Frontend**
- [ ] Crear componente `QuantitySelector` con botones +/− y display numérico
- [ ] Agregar estado `quantity` en `EventDetail.tsx`, inicializado en 1
- [ ] Pasar `quantity` como prop a `TicketPanel` o renderizar el selector junto al CTA "Reservar"
- [ ] Propagar `quantity` a `CheckoutScreen`, `OrderSummary` y `PaymentPanel`
- [ ] Eliminar todos los hardcodes de `quantity = 2` en `EventDetail.tsx`, `CheckoutScreen.tsx`, `PaymentScreen.tsx`
- [ ] Recalcular `total = tierPrice * quantity + SERVICE_FEE` dinámicamente
- [ ] Limitar el máximo del selector a `tier.quota`
- [ ] Actualizar textos que referencian la cantidad ("2 entradas" → dinámico)
- [ ] Actualizar `StoredTicket` para reflejar la cantidad real

**QA**
- [ ] Verificar valor por defecto = 1
- [ ] Verificar incremento/decremento con botones
- [ ] Verificar que no se puede exceder la cuota del tier
- [ ] Verificar que no se puede bajar de 1
- [ ] Verificar que el total se recalcula en checkout y pago
- [ ] Verificar que la cantidad correcta se guarda en el ticket

---

### HU-AUD-04: Botón de reintento de pago desde notificación de rechazo — SP: 3

Como **Comprador**
Quiero poder volver al flujo de pago directamente desde la notificación de pago rechazado
Para reintentar el pago rápidamente sin tener que buscar el evento de nuevo en la cartelera

**Prioridad:** Media
**Estimación:** 3 SP
**Justificación SP:** Requiere agregar un botón de acción dentro de la notificación en `NotificationsPanel`, navegar programáticamente a la vista de detalle del evento con el estado de reserva activa, y restaurar el contexto del flujo de pago (reservationId, tierId, eventId). El timer de 10min sigue corriendo en el backend, por lo que el botón solo debe mostrarse si la reserva no ha expirado.

#### Criterios de Aceptación

**CA-01. Botón "Reintentar pago" visible en notificaciones de rechazo**
```gherkin
Escenario: Acción de reintento en notificación de pago rechazado
  Dado que el comprador tiene una notificación de tipo "payment_rejected" en el panel de notificaciones
  Cuando abre el panel de notificaciones
  Entonces cada notificación de pago rechazado muestra un botón "Reintentar pago"
  Y las notificaciones de otros tipos (timer_expired, payment_success) NO muestran dicho botón
```

**CA-02. Navegación al detalle del evento desde la notificación**
```gherkin
Escenario: Click en "Reintentar pago"
  Dado que el comprador ve una notificación de pago rechazado con botón "Reintentar pago"
  Cuando hace click en el botón
  Entonces se cierra el panel de notificaciones
  Y el comprador es redirigido a la vista de detalle del evento asociado (/eventos/:eventId)
```

**CA-03. Notificación de expiración NO muestra botón de reintento**
```gherkin
Escenario: Sin acción para notificaciones de timer expirado
  Dado que el comprador tiene una notificación de tipo "timer_expired"
  Cuando abre el panel de notificaciones
  Entonces la notificación de expiración NO muestra ningún botón de acción
  Y solo muestra el mensaje informativo de que las entradas fueron liberadas
```

**CA-04. Notificación de compra exitosa NO muestra botón de reintento**
```gherkin
Escenario: Sin acción para notificaciones de pago exitoso
  Dado que el comprador tiene una notificación de tipo "payment_success"
  Cuando abre el panel de notificaciones
  Entonces la notificación de éxito NO muestra el botón "Reintentar pago"
```

#### Subtasks

**DEV Frontend**
- [ ] Agregar prop `eventId` al modelo `AppNotification` (extraído de `BackendNotification.eventId` o de la notificación local)
- [ ] Agregar botón "Reintentar pago" en `NotificationsPanel` solo para items con `type === 'payment_rejected'`
- [ ] Implementar navegación programática con `useNavigate()` a `/eventos/${notification.eventId}`
- [ ] Cerrar el panel de notificaciones al hacer click en el botón
- [ ] Estilizar el botón con CSS Modules, consistente con el diseño Teatro Noir
- [ ] Asegurar que `eventId` se propaga desde la notificación local (`addNotification`) y desde el backend (`BackendNotification.eventId`)

**QA**
- [ ] Verificar que el botón "Reintentar pago" aparece solo en notificaciones `payment_rejected`
- [ ] Verificar que el click navega a `/eventos/:eventId` correcto
- [ ] Verificar que el panel se cierra tras hacer click
- [ ] Verificar que notificaciones `timer_expired` y `payment_success` NO tienen botón
- [ ] Verificar que el botón no aparece si no hay `eventId` en la notificación

---

### HU-AUD-05: Limpieza de código muerto y endpoints sin uso — SP: 2

Como **Equipo de Desarrollo**
Quiero documentar los endpoints backend que no tienen consumidor en el frontend y los TODO markers pendientes
Para mantener un inventario claro de deuda técnica y planificar su resolución o deprecación

**Prioridad:** Baja
**Estimación:** 2 SP
**Justificación SP:** Tarea de documentación e inventario. No requiere eliminar código sino registrar la deuda técnica con un plan de acción.

#### Criterios de Aceptación

**CA-01. Inventario de endpoints sin consumo en el frontend**
```gherkin
Escenario: Documentación de endpoints huérfanos
  Dado que se completa la auditoría del proyecto
  Cuando se genera el inventario de deuda técnica
  Entonces se documenta que los siguientes endpoints no tienen consumidor en el frontend:
    | Endpoint                             | Microservicio     | Decisión sugerida               |
    | GET /api/v1/tickets/{ticketId}       | ms-ticketing      | Consumir desde MyTicketsPage    |
    | GET /api/v1/notifications/{resId}    | ms-notifications  | Evaluar necesidad o deprecar    |
    | GET /api/v1/rooms/{roomId}           | ms-events         | Evaluar necesidad o deprecar    |
```

**CA-02. Inventario de TODO markers en el código**
```gherkin
Escenario: Documentación de TODOs pendientes
  Dado que se completa la auditoría
  Cuando se revisan los marcadores TODO
  Entonces se documenta que reservationService.ts contiene 3 TODO markers sobre reemplazar el buyerId hardcodeado con el contexto de autenticación
  Y se asigna como deuda técnica a resolver cuando se implemente autenticación real
```

#### Subtasks

**DEV**
- [ ] Crear entry en el backlog o ADR con la lista de endpoints sin uso
- [ ] Crear entry con la lista de TODO markers y su plan de resolución
- [ ] Agregar labels de deuda técnica en el tablero de GitHub Projects

**QA**
- [ ] Verificar que los endpoints documentados efectivamente no tienen consumidor
- [ ] Verificar que los TODO markers referenciados existen en el código
