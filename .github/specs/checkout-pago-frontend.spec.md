---
id: SPEC-010
status:  APPROVED
feature: checkout-pago-frontend
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: ["SPEC-004", "SPEC-008", "SPEC-009"]
---

# Spec: Flujo de Checkout y Pago — Frontend

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Implementación del flujo transaccional completo en el frontend de SEM7: transiciones animadas entre pantallas, navbar en modo transaccional con temporizador, pantalla de Checkout (resumen + email), pantalla de Pago Simulado (mock), pantalla de Confirmación exitosa con ticket digital y pantalla de Pago Rechazado con reintento. El flujo se activa al hacer clic en "Reservar" dentro de `EventDetail` (SPEC-009) y controla el ciclo completo hasta la confirmación o cancelación.

**Capa afectada:** `frontend/`  
**Depende de:** SPEC-009 HU-FE-10/11 (selección de tier y CTA en detalle), SPEC-004 (ms-ticketing — `POST /api/v1/reservations` y `POST /.../payments`)  
**Stack:** React 19 · TypeScript 5 · CSS Modules · Vite · Axios · React Router v7 · Framer Motion · `AnimatePresence`

---

### Historias de Usuario

#### HU-FE-13: Transiciones animadas entre pantallas del flujo

```
Como:        Comprador
Quiero:      Transiciones fluidas entre las pantallas del flujo de compra
Para:        Tener una experiencia cohesionada a lo largo de todo el recorrido

Prioridad:   Media
Estimación:  2 SP
Dependencias: SPEC-009 (EventDetail con ScreenState ya parcialmente implementado)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-13

**CA-FE13-01. Salida y entrada animadas entre pantallas**
```gherkin
Escenario: Transición al navegar entre pantallas del flujo
  Dado que el comprador está en cualquier pantalla del flujo
  Cuando el estado de pantalla (screen) cambia a otro valor
  Entonces la pantalla actual desaparece con fade-out y slide-up (y: 0 → -20, opacity: 1 → 0)
  Y la nueva pantalla aparece con fade-in y slide-down (y: 20 → 0, opacity: 0 → 1)
```

**CA-FE13-02. Duración y easing personalizados**
```gherkin
Escenario: Curva de animación fluida
  Dado que ocurre cualquier transición entre pantallas
  Cuando la animación se ejecuta
  Entonces la duración total es de ~0.4 segundos
  Y la curva de easing es [0.22, 1, 0.36, 1] (ease-out-expo)
```

**CA-FE13-03. AnimatePresence en modo "wait" evita superposición**
```gherkin
Escenario: Sin superposición de pantallas durante la transición
  Dado que el comprador navega entre pantallas
  Cuando la transición ocurre
  Entonces la pantalla saliente completa su animación de salida ANTES de que la entrante inicie
  Y en ningún momento dos pantallas son visibles simultáneamente
```

**CA-FE13-04. Estado de pantalla tipado**
```gherkin
Escenario: Navegación interna controlada por estado (Screen type)
  Dado que el comprador avanza en el flujo
  Cuando el estado cambia
  Entonces la pantalla visible corresponde al valor activo del tipo Screen
  Y los valores válidos son: 'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'failure'
```

---

#### HU-FE-14: Navbar en modo transaccional con temporizador de reserva

```
Como:        Comprador en el flujo de compra
Quiero:      Ver la barra de navegación adaptada al proceso de pago activo y el tiempo restante de mi reserva
Para:        Sentir la urgencia y saber cuándo expira mi lugar reservado

Prioridad:   Alta
Estimación:  3 SP
Dependencias: HU-FE-13 (Screen type), SPEC-008 HU-FE-05 (prop isTransactional ya implementado en NavBar)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-14

**CA-FE14-01. Navbar en modo transaccional en checkout, pago y fallo**
```gherkin
Escenario: Navbar adapta su apariencia al modo transaccional
  Dado que el comprador entra a la pantalla checkout, payment, failure o success
  Cuando el navbar se renderiza
  Entonces el fondo cambia a color primary (fondo sólido oscuro) con texto blanco
  Y los links de navegación (Events, Venues, My Tickets) se ocultan
  Y los íconos Bell, ShoppingCart y avatar se ocultan
  Y la transición de fondo es suave (transition-all duration-500)
```

**CA-FE14-02. Pill del temporizador visible en checkout, payment y failure**
```gherkin
Escenario: Timer visible durante el flujo transaccional activo
  Dado que el comprador está en checkout, payment o failure
  Cuando el navbar transaccional se renderiza
  Entonces se muestra un pill con ícono Timer y el tiempo en formato MM:SS (ej. "09:59")
  Y el pill tiene fondo black/20 con backdrop-blur y texto blanco en negrita
  Y el contador decrementa en tiempo real (cada segundo)
```

**CA-FE14-03. Timer se inicia una sola vez y es compartido entre pantallas**
```gherkin
Escenario: Sincronización del timer entre pantallas transaccionales
  Dado que el comprador entra al checkout con timer en 09:59
  Cuando avanza a payment o retrocede a checkout
  Entonces el timer continúa desde donde quedó sin reiniciarse
  Y si llega a 00:00 la reserva expira (botón de reintento deshabilitado)
```

**CA-FE14-04. Timer no visible en la pantalla de éxito**
```gherkin
Escenario: Pantalla de éxito sin timer
  Dado que el comprador completa el pago exitosamente
  Cuando la pantalla success se muestra
  Entonces el navbar transaccional NO muestra el pill del timer
  Y únicamente se muestra el logo sobre fondo primary
```

**CA-FE14-05. Navbar en modo normal en catálogo y detalle**
```gherkin
Escenario: Navbar estándar fuera del flujo transaccional
  Dado que el comprador está en catalog o details
  Cuando el navbar se renderiza
  Entonces el fondo es transparente con backdrop-blur (bg-surface/80)
  Y se muestran los links de navegación y los íconos de acción
```

---

#### HU-FE-15: Vista de Checkout — Finalizar Reserva

```
Como:        Comprador
Quiero:      Ver el resumen de mi reserva y confirmar mi correo antes de ir al pago
Para:        Verificar que los datos son correctos y recibir mis tickets por correo

Prioridad:   Alta
Estimación:  5 SP
Dependencias: HU-FE-13 (Screen type), HU-FE-10/11 (tier seleccionado del detalle)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-15

**CA-FE15-01. Resumen del pedido con tier, evento y asientos**
```gherkin
Escenario: Detalle del pedido en el checkout
  Dado que el comprador llega a la pantalla checkout desde el detalle del evento
  Cuando la vista se renderiza
  Entonces se muestra la cantidad de tickets (2x), el nombre del tier y el título del evento
  Y se muestran la fecha del evento y la hora (ej. "22:00")
  Y se muestran los asientos reservados (ej. "B12, B13") y la ubicación (ej. "Main Stage Loft")
  Y el bloque lleva un ícono Ticket (lucide-react) visible en la esquina
```

**CA-FE15-02. Formulario de correo electrónico**
```gherkin
Escenario: Captura de email para envío de tickets
  Dado que el comprador está en el checkout
  Cuando visualiza la sección "Información del Comprador"
  Entonces se muestra un campo de tipo email con label "Correo Electrónico"
  Y el placeholder es "tu@email.com"
  Y debajo del campo aparece el texto: "Enviaremos tus e-tickets y el código QR de acceso a esta dirección inmediatamente después del pago."
```

**CA-FE15-03. Panel de resumen de pago con total calculado**
```gherkin
Escenario: Cálculo del total a pagar
  Dado que el comprador tiene seleccionado un tier con precio P
  Cuando el checkout se renderiza
  Entonces el panel muestra el desglose: "2x [nombre del tier] = $P×2" y "Service Fee = $10.00"
  Y el total = $P×2 + $10.00 se muestra en tipografía 3xl
  Y el panel es sticky top-28 en desktop (lg:)
```

**CA-FE15-04. Botón "Continuar al Pago" requiere email válido**
```gherkin
Escenario: Validación de email antes de continuar
  Dado que el comprador está en el checkout
  Cuando el campo de email está vacío o no contiene "@" y dominio
  Entonces el botón "Continuar al Pago" no puede completar la acción (disabled o validación inline)
  Cuando el comprador ingresa un email válido
  Entonces puede hacer clic en "Continuar al Pago" y avanza a la pantalla de pago
```

**CA-FE15-05. Creación de la reserva y del objeto Order al avanzar al pago**
```gherkin
Escenario: Llamada a POST /api/v1/reservations al hacer clic en "Continuar al Pago"
  Dado que el comprador hace clic en "Continuar al Pago" con email válido
  Cuando la acción se ejecuta
  Entonces se realiza POST /api/v1/reservations con { eventId, tierId }
  Y si la respuesta es 201 se crea el objeto Order local con: reservationId, eventId, tierId, email, total, referencia "#NE-XXXXXX"
  Y el comprador avanza a la pantalla de payment con el Order disponible
  Y si la respuesta es error se muestra un mensaje inline descriptivo sin avanzar
```

**CA-FE15-06. Indicadores de seguridad en el panel**
```gherkin
Escenario: Confianza visual en el checkout
  Dado que el comprador visualiza el panel de pago
  Cuando el panel está completamente renderizado
  Entonces se muestran íconos CreditCard, ShieldCheck y CheckCircle2 con opacidad baja
  Y el texto "Pago Seguro Encriptado" aparece en uppercase tracking-widest
```

---

#### HU-FE-16: Vista de Pago Simulado (mock payment)

```
Como:        Comprador
Quiero:      Ver la pantalla donde puedo simular pago exitoso o rechazado
Para:        Validar ambos flujos del proceso de compra en el entorno de desarrollo

Prioridad:   Alta
Estimación:  3 SP
Dependencias: HU-FE-15 (Order generado con reservationId), SPEC-004 (POST /{id}/payments)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-16

**CA-FE16-01. Total del pedido prominente**
```gherkin
Escenario: Visualización del monto a pagar
  Dado que el comprador llega a la pantalla de pago simulado
  Cuando la vista se renderiza
  Entonces se muestra el total en tipografía muy grande (≥ 4rem) centrada en la parte superior
  Y debajo el texto descriptivo "Total de la reserva por 2 entradas [tier]"
```

**CA-FE16-02. Dos opciones de simulación**
```gherkin
Escenario: Botones de simulación de pago
  Dado que el comprador está en la pantalla de pago
  Cuando la vista se renderiza
  Entonces se muestran dos tarjetas en grid (1 col mobile / 2 col desktop):
    - "Simular Pago Exitoso" con ícono CheckCircle2 color primary
    - "Simular Pago Rechazado" con ícono XCircle color error (red)
  Y cada opción tiene una descripción breve
  Y al hacer hover el ícono escala y el borde se intensifica
```

**CA-FE16-03. Clic en "Exitoso" llama al backend y avanza a success**
```gherkin
Escenario: Resultado de pago exitoso
  Dado que el comprador hace clic en "Simular Pago Exitoso"
  Cuando la acción se ejecuta
  Entonces se llama POST /api/v1/reservations/{reservationId}/payments con { amount, paymentMethod: "MOCK", status: "APPROVED" }
  Y si la respuesta es 200 (status: CONFIRMED) el flujo avanza a la pantalla success con el TicketResponse
  Y el timer se detiene
```

**CA-FE16-04. Clic en "Rechazado" llama al backend y avanza a failure**
```gherkin
Escenario: Resultado de pago rechazado
  Dado que el comprador hace clic en "Simular Pago Rechazado"
  Cuando la acción se ejecuta
  Entonces se llama POST /api/v1/reservations/{reservationId}/payments con { amount, paymentMethod: "MOCK", status: "DECLINED" }
  Y el flujo avanza a la pantalla failure
  Y el timer continúa corriendo (la reserva sigue activa)
```

**CA-FE16-05. Resumen del pedido y miniatura en la parte inferior**
```gherkin
Escenario: Referencia y miniatura del evento en pago
  Dado que el comprador está en la pantalla de pago
  Cuando visualiza el resumen inferior
  Entonces se muestra la referencia del pedido (ej. "#NE-123456")
  Y se muestra la miniatura del evento en escala de grises con opacidad reducida
  Y se muestra el nombre del evento y el tipo de acceso (ej. "Acceso VIP - Sector B")
```

---

#### HU-FE-17: Vista de Confirmación de Compra Exitosa con Ticket Digital

```
Como:        Comprador
Quiero:      Ver la pantalla de confirmación con mi ticket digital completo después del pago exitoso
Para:        Tener acceso inmediato al comprobante, mis asientos y el código QR de entrada

Prioridad:   Alta
Estimación:  5 SP
Dependencias: HU-FE-16 (TicketResponse del backend)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-17

**CA-FE17-01. Encabezado de pago aprobado**
```gherkin
Escenario: Mensaje principal de confirmación
  Dado que el pago fue simulado como exitoso
  Cuando la pantalla success se renderiza
  Entonces se muestra un ícono CheckCircle2 dentro de un círculo con fondo primary/10
  Y el texto "¡Pago aprobado!" aparece en tipografía ≥ 4xl
  Y el subtítulo es "Tu lugar está asegurado para una noche inolvidable."
```

**CA-FE17-02. Ticket digital con imagen, datos y asientos**
```gherkin
Escenario: Componente de ticket digital completo
  Dado que la pantalla de confirmación está visible
  Cuando el comprador visualiza el ticket
  Entonces se muestra:
    - Imagen del evento en escala de grises (zona superior del ticket)
    - Gradiente de la imagen hacia el fondo del card
    - Badge "Confirmado" y título del evento en uppercase sobre la imagen
    - Fecha y hora del evento
    - Nombre del venue y sala
    - Ubicación del asiento (ej. "VIP - Platea Central") y número de asientos (ej. "B12, B13")
```

**CA-FE17-03. Separador decorativo de perforación**
```gherkin
Escenario: Efecto visual de ticket físico
  Dado que el ticket digital está visible
  Cuando el comprador observa la separación entre cuerpo y sección QR
  Entonces se ve una línea punteada horizontal (border-dashed)
  Y a cada extremo hay un círculo recortado (-left-4, -right-4) que simula las muescas de un ticket
```

**CA-FE17-04. Sección de acceso con QR y número de ticket**
```gherkin
Escenario: Código QR y número de ticket en el ticket digital
  Dado que el comprador visualiza la parte inferior del ticket
  Cuando la sección de acceso se renderiza
  Entonces se muestra un placeholder QR sobre fondo blanco
  Y debajo el ID del ticket en fuente monospace (ej. "#NE-123456-X9")
  Y encima el label "ID de Ticket" en uppercase tracking-widest
```

**CA-FE17-05. Acciones post-compra: Descargar y Volver al Catálogo**
```gherkin
Escenario: Botones de acción tras la confirmación
  Dado que la pantalla de confirmación está visible
  Cuando el comprador visualiza los botones de acción
  Entonces se muestra "Descargar Ticket" con ícono Download y estilo primary-gradient
  Y "Volver al Catálogo" con estilo secundario
  Y haciendo clic en "Volver al Catálogo" el estado de screen vuelve a 'catalog' y se navega a /eventos
```

---

#### HU-FE-18: Vista de Pago Rechazado — Recuperación y Reintento

```
Como:        Comprador cuyo pago fue rechazado
Quiero:      Ver un mensaje claro de que el pago falló, el tiempo restante y las opciones para reintentar
Para:        Recuperar mi lugar sin tener que empezar el proceso desde cero

Prioridad:   Alta
Estimación:  3 SP
Dependencias: HU-FE-16 (resultado DECLINED), HU-FE-14 (timer compartido)
Capa:        Frontend
```

##### Criterios de Aceptación — HU-FE-18

**CA-FE18-01. Banner de error con tiempo restante**
```gherkin
Escenario: Notificación de pago rechazado
  Dado que el pago simulado fue rechazado
  Cuando la pantalla failure se renderiza
  Entonces se muestra un banner con ícono XCircle color primary y fondo error/10
  Y el título es "Pago declinado." en tipografía negrita
  Y el mensaje incluye el tiempo restante en color primary: "Tu reserva sigue activa por [MM:SS] minutos."
  Y el banner tiene una barra vertical izquierda de color primary
```

**CA-FE18-02. Resumen del pedido fallido**
```gherkin
Escenario: Detalles del pedido en pantalla de fallo
  Dado que el comprador está en failure
  Cuando visualiza la sección de detalles
  Entonces se muestra el nombre del evento, sección y asientos
  Y se muestra el total del pedido en tipografía bold
  Y se muestra el método de pago con ícono CreditCard y últimos 4 dígitos ("Visa **** 8821")
```

**CA-FE18-03. Botón de reintento con contador de intentos**
```gherkin
Escenario: Botón de reintentar pago con intentos restantes
  Dado que el comprador tiene intentos restantes (máximo 3 según backend)
  Cuando visualiza la pantalla de fallo
  Entonces el botón principal muestra "Reintentar Pago (Intento X de 3)" con ícono RefreshCcw
  Y el botón tiene estilo primary-gradient
  Y al hacer clic regresa a la pantalla de payment
  Y si el timer llegó a 00:00 el botón está deshabilitado
```

**CA-FE18-04. Opción de cambiar método de pago**
```gherkin
Escenario: Cambio al checkout para nuevo método
  Dado que el comprador prefiere usar otro método
  Cuando hace clic en "Usar otro método de pago"
  Entonces el flujo regresa a la pantalla checkout preservando el tier y evento seleccionados
```

**CA-FE18-05. Sugerencia de resolución al comprador**
```gherkin
Escenario: Texto de orientación en pantalla de fallo
  Dado que el comprador está en failure
  Cuando visualiza el área inferior
  Entonces se muestra en estilo italic discreto: "Por favor, verifica los datos de tu tarjeta o intenta con otro método de pago."
```

---

### Reglas de Negocio

1. **Control de pantallas por estado:** El flujo completo (checkout → payment → success / failure) se gestiona mediante `ScreenState` local dentro de `EventDetail.tsx` o en un contexto global. No se crean nuevas URLs para estas pantallas en esta iteración.
2. **Tipo Screen:** `'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'failure'`. El tipo `ScreenState = 'detail' | 'checkout'` ya existe en `EventDetail.tsx` y debe extenderse.
3. **Creación de reserva (timing):** `POST /api/v1/reservations` se llama al hacer clic en "Continuar al Pago" en el checkout, **no** al hacer clic en "Reservar" en el detalle. El `reservationId` recibido se almacena en el objeto `Order` local.
4. **Procesamiento del pago (timing):** `POST /api/v1/reservations/{id}/payments` se llama al hacer clic en "Simular Pago Exitoso" o "Simular Pago Rechazado". Se envía `status: "APPROVED"` o `status: "DECLINED"`, con `paymentMethod: "MOCK"` siempre.
5. **Máximo 3 intentos de pago:** El backend devuelve `409 CONFLICT` si se supera el límite. El frontend debe deshabilitar el botón de reintento y mostrar un mensaje apropiado.
6. **Timer de reserva:** Se inicializa en 599 segundos (9:59) la primera vez que el usuario entra a checkout. Se gestiona con `setInterval` en el componente raíz (`EventDetail` o `App`). Se destruye (clearInterval) cuando: el pago es exitoso, el timer llega a 0, o el usuario abandona el flujo (navega a `/eventos`).
7. **Objeto Order (local, en memoria):**
   ```
   { reservationId, eventId, tierId, tierType, tierPrice, quantity: 2, email, total, reference }
   ```
   No se persiste en localStorage ni en backend. Se pierde al recargar la página.
8. **Reintento de pago:** Al hacer reintento, el `retryCount` se incrementa localmente. El backend rastrea los intentos por su lado. Si el backend devuelve `409` al reintentar, el frontend debe mostrar "Límite de intentos alcanzado" y deshabilitar el botón.
9. **AnimatePresence:** Debe envolver la renderización de pantallas. La `key` del `motion.div` debe ser el valor de `screen` para que Framer Motion detecte el cambio y ejecute exit + enter.
10. **Navbar transaccional:** Las pantallas `checkout`, `payment`, `success` y `failure` activan el modo transaccional (fondo primary). El timer se muestra en `checkout`, `payment` y `failure` pero NO en `success`.

---

## 2. DISEÑO

### Modelos de Datos

> Este feature no introduce cambios en la base de datos del backend. Consume los endpoints de ms-ticketing ya existentes (SPEC-004).

#### Interfaces TypeScript nuevas (frontend)

```typescript
// types/flow.types.ts — nuevo archivo

type Screen = 'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'failure';

interface Order {
  reservationId: string;       // UUID del backend
  eventId: string;
  tierId: string;
  tierType: string;            // "VIP" | "GENERAL" | "EARLY_BIRD"
  tierPrice: number;
  quantity: number;            // siempre 2 en esta iteración
  email: string;
  total: number;               // tierPrice * quantity + 10 (service fee)
  reference: string;           // "#NE-XXXXXX"
}

interface FlowState {
  screen: Screen;
  order: Order | null;
  ticket: TicketInfo | null;   // poblado tras pago exitoso
  timeLeft: number;            // segundos restantes (empieza en 599)
  retryCount: number;          // intentos de pago fallidos (máximo 3)
}

interface TicketInfo {
  ticketId: string;            // UUID del ticket del backend
  reservationId: string;
  eventId: string;
  tierId: string;
  tierType: string;
  price: number;
  status: string;              // "VALID"
  createdAt: string;
}
```

---

### API Endpoints consumidos (ms-ticketing via api-gateway)

> No se crean nuevos endpoints. El frontend consume los ya implementados en SPEC-004.

#### POST /api/v1/reservations

- **Descripción:** Crea una reserva y bloquea la entrada por 10 minutos
- **Cuándo se llama:** Al hacer clic en "Continuar al Pago" en el Checkout (HU-FE-15)
- **Headers:** `X-User-Id: <buyerId>` (requerido por el backend; en esta iteración se usa un UUID fijo de demo o del contexto de auth)
- **Request Body:**
  ```json
  { "eventId": "uuid", "tierId": "uuid" }
  ```
- **Response 201 — Reserva creada:**
  ```json
  {
    "id": "uuid",
    "eventId": "uuid",
    "tierId": "uuid",
    "buyerId": "uuid",
    "status": "PENDING",
    "createdAt": "2026-03-27T20:00:00Z",
    "updatedAt": "2026-03-27T20:00:00Z",
    "validUntilAt": "2026-03-27T20:10:00Z"
  }
  ```
- **Response 400:** datos inválidos (`eventId` o `tierId` faltantes)
- **Response 404:** evento o tier no encontrado
- **Response 409:** tier sin cupo disponible

#### POST /api/v1/reservations/{reservationId}/payments

- **Descripción:** Procesa el mock payment de una reserva PENDING o PAYMENT_FAILED
- **Cuándo se llama:** Al hacer clic en "Simular Pago Exitoso" o "Simular Pago Rechazado" (HU-FE-16)
- **Headers:** `X-User-Id: <buyerId>` (requiere ser el propietario de la reserva)
- **Request Body (Éxito):**
  ```json
  { "amount": 170.00, "paymentMethod": "MOCK", "status": "APPROVED" }
  ```
- **Request Body (Fallo):**
  ```json
  { "amount": 170.00, "paymentMethod": "MOCK", "status": "DECLINED" }
  ```
- **Response 200 — Pago aprobado:**
  ```json
  {
    "reservationId": "uuid",
    "status": "CONFIRMED",
    "ticketId": "uuid",
    "message": "Payment approved. Ticket generated.",
    "ticket": {
      "id": "uuid",
      "reservationId": "uuid",
      "eventId": "uuid",
      "tierId": "uuid",
      "tierType": "VIP",
      "price": 160.00,
      "status": "VALID",
      "createdAt": "2026-03-27T20:01:00Z"
    },
    "timestamp": "2026-03-27T20:01:00Z"
  }
  ```
- **Response 200 — Pago rechazado:**
  ```json
  {
    "reservationId": "uuid",
    "status": "PAYMENT_FAILED",
    "ticketId": null,
    "message": "Payment declined.",
    "ticket": null,
    "timestamp": "2026-03-27T20:01:30Z"
  }
  ```
- **Response 400:** reserva expirada, método inválido, status inválido
- **Response 403:** X-User-Id no es el propietario de la reserva
- **Response 404:** reserva no encontrada
- **Response 409:** cupo agotado o máximo de 3 intentos superado

---

### Diseño Frontend

#### Nuevo servicio

| Función | Archivo | Endpoint | Cuándo |
|---------|---------|----------|--------|
| `createReservation(eventId, tierId, buyerId)` | `services/reservationService.ts` | `POST /api/v1/reservations` | Al hacer clic en "Continuar al Pago" |
| `processPayment(reservationId, amount, status, buyerId)` | `services/reservationService.ts` | `POST /api/v1/reservations/{id}/payments` | Al hacer clic en "Simular Pago Exitoso/Rechazado" |

#### Nuevas páginas / pantallas

> Las pantallas son componentes renderizados dentro de `EventDetail.tsx` según el estado `screen`. No son páginas con rutas propias en esta iteración.

| Pantalla | Componente | `screen` | Descripción |
|----------|------------|----------|-------------|
| Checkout | `pages/EventDetail/screens/CheckoutScreen.tsx` | `'checkout'` | Resumen de pedido + form email + panel de pago sticky |
| Payment | `pages/EventDetail/screens/PaymentScreen.tsx` | `'payment'` | Dos opciones de mock payment + resumen inferior |
| Success | `pages/EventDetail/screens/SuccessScreen.tsx` | `'success'` | Ticket digital completo + botones de acción |
| Failure | `pages/EventDetail/screens/FailureScreen.tsx` | `'failure'` | Banner de error + resumen + reintento |

#### Nuevos componentes

| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `OrderSummary` | `components/Checkout/OrderSummary.tsx` | `event`, `tier`, `total` | Bloque de resumen de evento, asientos y total |
| `PaymentPanel` | `components/Checkout/PaymentPanel.tsx` | `total`, `email`, `onEmailChange`, `onContinue`, `loading` | Panel sticky de pago con email, total y CTA |
| `MockPaymentOption` | `components/Payment/MockPaymentOption.tsx` | `type: 'success' \| 'failure'`, `onClick`, `loading` | Tarjeta de opción de simulación (Exitoso / Rechazado) |
| `DigitalTicket` | `components/Ticket/DigitalTicket.tsx` | `event`, `ticket`, `order` | Tarjeta de ticket con imagen grayscale, datos, separador decorativo y QR placeholder |
| `FailureBanner` | `components/Failure/FailureBanner.tsx` | `timeLeft: string` | Banner de error con tiempo restante interpolado y borde primario |

#### Modificaciones a componentes existentes

| Componente | Archivo | Cambio |
|------------|---------|--------|
| `EventDetail` | `pages/EventDetail/EventDetail.tsx` | Extender `ScreenState` a los 6 valores del tipo `Screen`. Agregar gestión del timer (`setInterval`). Renderizar cada pantalla con `AnimatePresence` + `motion.div key={screen}`. Agregar `<AnimatePresence mode="wait">`. Pasar `screen`, `timeLeft`, `order`, `ticket` a las sub-pantallas. |
| `NavBar` | `components/NavBar/NavBar.tsx` | Agregar prop `timeLeft?: string` para mostrar el pill del timer cuando `isTransactional && screen !== 'success'`. Ícono `Timer` de lucide-react en el pill. |
| `BottomNav` | `components/NavBar/BottomNav.tsx` | Mapear `screen` → `activeTab`: `checkout|payment|failure` → `'payment'`, `success` → `'profile'`, `catalog` → `'explore'` |
| `App.tsx` | `src/App.tsx` | No requiere nuevas rutas. Las pantallas transaccionales se renderizan dentro de `/eventos/:id`. |

#### Nuevos archivos de tipos

| Archivo | Exporta |
|---------|---------|
| `types/flow.types.ts` | `Screen`, `Order`, `FlowState`, `TicketInfo` |

#### Hooks y estado

| Responsabilidad | Dónde vive | Detalle |
|-----------------|-----------|---------|
| `screen: Screen` | `useState` en `EventDetail.tsx` | Estado de la pantalla activa |
| `order: Order \| null` | `useState` en `EventDetail.tsx` | Construido al crear la reserva exitosamente |
| `ticket: TicketInfo \| null` | `useState` en `EventDetail.tsx` | Poblado al procesar pago exitoso |
| `timeLeft: number` | `useState` en `EventDetail.tsx` | segundos, init: 599; decrementado por `setInterval` |
| `retryCount: number` | `useState` en `EventDetail.tsx` | Incrementa al recibir PAYMENT_FAILED |
| `email: string` | `useState` en `CheckoutScreen.tsx` o propagado desde EventDetail | Capturado en el form del checkout |
| `loadingReservation` / `loadingPayment` | `useState` locales en cada pantalla | Indicadores de carga para las llamadas HTTP |

#### Archivos CSS Modules nuevos

| Módulo | Pantalla / Componente |
|--------|-----------------------|
| `CheckoutScreen.module.css` | Layout 2 columnas, form de email, panel sticky |
| `PaymentScreen.module.css` | Layout centrado max-w-2xl, grid de opciones |
| `SuccessScreen.module.css` | Encabezado, ticket digital, separador perforación |
| `FailureScreen.module.css` | Banner con borde izquierdo, layout max-w-lg |
| `DigitalTicket.module.css` | Imagen grayscale, gradiente, separador dashed, QR |
| `FailureBanner.module.css` | Borde vertical izquierdo primary, fondo error/10 |

#### Arquitectura y dependencias

- **Dependencias ya instaladas:** `framer-motion` (AnimatePresence disponible), `lucide-react` (Timer, CheckCircle2, XCircle, RefreshCcw, Download, CreditCard, ShieldCheck, Ticket, ChevronLeft), `axios`
- **Dependencias nuevas:** ninguna
- **Impacto en `App.tsx`:** sin cambios de rutas. Todo el flujo transaccional ocurre dentro de la ruta existente `/eventos/:id`
- **X-User-Id en peticiones:** En esta iteración sin auth, usar un UUID de demo fijo (ej. `"11111111-1111-1111-1111-111111111111"`). Documentar como deuda técnica para cuando se integre el sistema de auth.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Frontend

#### Tipos
- [ ] Crear `types/flow.types.ts` con `Screen`, `Order`, `FlowState`, `TicketInfo`
- [ ] Extender `ScreenState` en `EventDetail.tsx` de `'detail' | 'checkout'` al tipo completo `Screen`

#### Servicios
- [ ] Crear `services/reservationService.ts` con función `createReservation(eventId, tierId, buyerId)` — `POST /api/v1/reservations` con header `X-User-Id`
- [ ] Agregar función `processPayment(reservationId, amount, status, buyerId)` en `reservationService.ts` — `POST /api/v1/reservations/{id}/payments`
- [ ] Documentar `X-User-Id` hardcoded como `TODO: replace with auth context` en ambas funciones

#### EventDetail — estado y flujo principal
- [ ] Agregar estados `order`, `ticket`, `timeLeft`, `retryCount`, `email` en `EventDetail.tsx`
- [ ] Implementar `setInterval` en `useEffect` para decrementar `timeLeft` cada segundo (init: 599)
- [ ] Limpiar interval con `clearInterval` en cleanup del `useEffect` y al llegar a 0
- [ ] Envolver la renderización de pantallas en `<AnimatePresence mode="wait"><motion.div key={screen} ...></AnimatePresence>`
- [ ] Implementar `motion.div` con `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -20 }}`, `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- [ ] Implementar función `handleContinueToPayment(email)` que llama a `createReservation`, construye `Order` y avanza a `'payment'`
- [ ] Implementar función `handleSimulatePayment(type: 'success' | 'failure')` que llama `processPayment` y avanza a `'success'` o `'failure'`
- [ ] Incrementar `retryCount` al recibir resultado PAYMENT_FAILED

#### NavBar — timer y modo transaccional
- [ ] Agregar prop `timeLeft?: string` en `NavBar.tsx` (formateado como "MM:SS")
- [ ] Renderizar pill del timer condicionalmente: visible cuando `isTransactional && screen !== 'success'`
- [ ] Agregar ícono `Timer` (lucide-react) en el pill
- [ ] Crear helper `formatTime(seconds: number): string` que devuelve "MM:SS"
- [ ] Actualizar `NavBar.module.css` con estilos del pill (backdrop-blur, black/20)

#### CheckoutScreen
- [ ] Crear `pages/EventDetail/screens/CheckoutScreen.tsx` con layout 2 columnas (lg:grid-cols-12, 7-col / 5-col)
- [ ] Renderizar `OrderSummary` con tier, evento, asientos "B12, B13" y ubicación "Main Stage Loft"
- [ ] Crear componente `OrderSummary.tsx` con ícono `Ticket`
- [ ] Implementar campo de email controlado con validación básica (contiene "@" y ".")
- [ ] Crear `PaymentPanel.tsx` con desglose: `tierPrice × 2`, `+$10 service fee`, total en 3xl
- [ ] Aplicar `sticky top-28 (lg:)` al panel de pago
- [ ] Implementar botón "Continuar al Pago" con estado disabled si email inválido y estado loading mientras se crea la reserva
- [ ] Mostrar error inline si la petición de reserva falla (ej. "No hay cupo disponible")
- [ ] Agregar íconos CreditCard, ShieldCheck, CheckCircle2 con opacidad 30% en el panel
- [ ] Implementar botón "Volver" (ChevronLeft) que regresa a `'details'`
- [ ] Crear `CheckoutScreen.module.css`

#### PaymentScreen
- [ ] Crear `pages/EventDetail/screens/PaymentScreen.tsx` con layout centrado max-w-2xl
- [ ] Mostrar `order.total` en tipografía ≥ 4rem centrada
- [ ] Crear `MockPaymentOption.tsx` para "Exitoso" (CheckCircle2, color primary) y "Rechazado" (XCircle, color error)
- [ ] Aplicar `group-hover:scale-110` al ícono y `border-primary` al borde en hover
- [ ] Renderizar grid 2-col desktop / 1-col mobile para las dos opciones
- [ ] Mostrar spinner/loading state en la opción seleccionada mientras se procesa el pago
- [ ] Mostrar referencia del pedido, miniatura grayscale del evento y tipo de acceso en la zona inferior
- [ ] Crear `PaymentScreen.module.css`

#### SuccessScreen
- [ ] Crear `pages/EventDetail/screens/SuccessScreen.tsx`
- [ ] Implementar encabezado: ícono CheckCircle2 en círculo `primary/10`, título "¡Pago aprobado!" ≥ 4xl
- [ ] Crear `DigitalTicket.tsx` con: imagen grayscale, gradiente overlay, badge "Confirmado", título uppercase, fecha, venue, asiento, separador dashed + círculos decorativos, QR placeholder, ID ticket con label
- [ ] Generar ID de ticket: `${order.reference}-X9` en fuente monospace
- [ ] Implementar botón "Descargar Ticket" (Download) — funcionalidad visual completa, descarga real pendiente (TODO)
- [ ] Implementar botón "Volver al Catálogo" que navega a `/eventos` (React Router `useNavigate`)
- [ ] Crear `SuccessScreen.module.css` y `DigitalTicket.module.css`

#### FailureScreen
- [ ] Crear `pages/EventDetail/screens/FailureScreen.tsx` con layout max-w-lg centrado
- [ ] Crear `FailureBanner.tsx` con prop `timeLeft: string`, borde vertical izquierdo primary, fondo error/10, ícono XCircle
- [ ] Renderizar resumen del pedido: evento, asientos, total, "Visa **** 8821" con ícono CreditCard
- [ ] Implementar botón "Reintentar Pago (Intento {retryCount} de 3)" con ícono RefreshCcw
- [ ] Deshabilitar botón de reintento cuando `timeLeft <= 0`
- [ ] Implementar botón "Usar otro método de pago" que regresa a `'checkout'`
- [ ] Agregar texto italic discreto de sugerencia de resolución
- [ ] Crear `FailureScreen.module.css` y `FailureBanner.module.css`

---

### QA

#### HU-FE-13 — Transiciones animadas
- [ ] Verificar que la pantalla saliente completa su exit before de que la entrante aparezca (mode="wait")
- [ ] Verificar duración ~0.4s y que se percibe fluida sin lag
- [ ] Verificar ausencia de flash de pantalla blanca en ninguna transición
- [ ] Verificar que el botón "Volver" en checkout regresa a la pantalla de detalle del evento

#### HU-FE-14 — Navbar transaccional con timer
- [ ] Verificar fondo primary del navbar en checkout/payment/failure/success
- [ ] Verificar fondo transparente en catalog y details
- [ ] Verificar que links y íconos (Bell, Cart, avatar) se ocultan en modo transaccional
- [ ] Verificar que el timer empieza en 09:59 y decrementa cada segundo
- [ ] Verificar que el timer NO reinicia al navegar entre checkout y payment
- [ ] Verificar que el timer NO aparece en la pantalla success
- [ ] Verificar transición suave (transition-all 500ms) del fondo del navbar

#### HU-FE-15 — Checkout
- [ ] Verificar que el tier seleccionado en detalle aparece correctamente en el resumen
- [ ] Verificar cálculo: precio×2 + $10 service fee fijos
- [ ] Verificar que el botón "Continuar al Pago" está deshabilitado sin email válido
- [ ] Verificar que el panel de pago es sticky en desktop al hacer scroll
- [ ] Verificar layout de 1 columna en mobile (no sticky)
- [ ] Verificar mensaje de error si la creación de reserva falla (409 sin cupo)
- [ ] Verificar que el botón muestra estado loading durante la petición

#### HU-FE-16 — Pago simulado
- [ ] Verificar que el total coincide exactamente con el calculado en checkout
- [ ] Verificar que "Exitoso" avanza a success y "Rechazado" avanza a failure
- [ ] Verificar que la miniatura del evento es grayscale con opacidad reducida
- [ ] Verificar que la referencia sigue el formato "#NE-XXXXXX"
- [ ] Verificar efecto hover: ícono escala y borde se intensifica
- [ ] Verificar que el grid colapsa a 1 columna en mobile (375px)
- [ ] Verificar estado loading en la opción seleccionada durante la petición

#### HU-FE-17 — Confirmación exitosa
- [ ] Verificar ícono CheckCircle2 con fondo primary/10 visible
- [ ] Verificar que la imagen del evento en el ticket es grayscale
- [ ] Verificar línea dashed y círculos decorativos de perforación
- [ ] Verificar ID de ticket en formato `${referencia}-X9` con fuente monospace
- [ ] Verificar que "Volver al Catálogo" lleva de vuelta a /eventos
- [ ] Verificar que el timer está detenido en la pantalla success

#### HU-FE-18 — Pago rechazado
- [ ] Verificar que el tiempo restante en el banner del fallo es el mismo que en el navbar (sincronizado)
- [ ] Verificar borde vertical izquierdo color primary en el banner
- [ ] Verificar que el botón de reintento regresa a la pantalla de pago y el contador se incrementa
- [ ] Verificar que el botón de reintento se deshabilita cuando timer = 0
- [ ] Verificar que "Usar otro método" regresa al checkout con tier y evento preservados
- [ ] Verificar comportamiento con 3 intentos fallidos: backend devuelve 409 y frontend muestra "Límite alcanzado"

#### General
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CA-FE13 a CA-FE18
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos del flujo transaccional
- [ ] Verificar responsividad completa: 375px, 768px, 1024px, 1280px en todas las pantallas del flujo
- [ ] Verificar que el UUID hardcodeado `X-User-Id` es identificable como TODO en el código
- [ ] Verificar que no hay fugas de memoria por `setInterval` sin `clearInterval` (devtools)
- [ ] Actualizar estado spec a `status: IMPLEMENTED` al completar el feature
