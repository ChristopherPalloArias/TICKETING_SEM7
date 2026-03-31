# Escenarios Gherkin — Carrito de Compras (SPEC-019)

> **Spec:** `.github/specs/carrito-compras.spec.md`
> **Feature:** Carrito de compras multi-evento (frontend-only)
> **Fecha:** 2026-03-30
> **Generado por:** QA Agent — `/gherkin-case-generator`

---

## Resumen de Cobertura

| HU | Criterios | Happy Path | Error Path | Edge Case | Total Escenarios |
|----|-----------|------------|------------|-----------|------------------|
| HU-CART-01 | CRITERIO-1.1 a 1.6 | 3 | 2 | 1 | 6 |
| HU-CART-02 | CRITERIO-2.1 a 2.7 | 3 | 2 | 2 | 7 |
| HU-CART-03 | CRITERIO-3.1 a 3.4 | 3 | 0 | 1 | 4 |
| HU-CART-04 | CRITERIO-4.1 a 4.6 | 3 | 2 | 1 | 6 |
| HU-CART-05 | CRITERIO-5.1 a 5.4 | 2 | 1 | 1 | 4 |
| **Total** | **22 criterios** | **14** | **7** | **6** | **27** |

---

## Flujos Críticos Identificados

| # | Flujo | Tipo | Tags | Impacto |
|---|-------|------|------|---------|
| 1 | Agregar item al carrito (reserva + persistencia) | Happy path principal | `@smoke @critico` | Alto |
| 2 | Pago individual desde carrito (restaurar checkout) | Happy path principal | `@smoke @critico` | Alto |
| 3 | Countdown y expiración de reservas | Lógica de negocio | `@critico` | Alto |
| 4 | Duplicado eventId+tierId rechazado | Validación de entrada | `@error-path` | Medio |
| 5 | Límite de 5 items | Validación de entrada | `@error-path` | Medio |
| 6 | Persistencia en localStorage | Integridad | `@smoke @critico` | Alto |
| 7 | Alertas de expiración próxima | UX crítica | `@edge-case` | Medio |

---

```gherkin
#language: es

Característica: Carrito de compras multi-evento
  Como comprador del sistema de ticketing
  Quiero agregar entradas de múltiples eventos a un carrito persistente
  Para revisar mi selección y proceder al pago cuando lo desee

  # ═══════════════════════════════════════════════════════
  # HU-CART-01: Agregar items al carrito desde detalle de evento
  # ═══════════════════════════════════════════════════════

  @happy-path @smoke @critico @HU-CART-01
  Escenario: CRITERIO-1.1 — Item agregado exitosamente al carrito
    Dado que el comprador está en la vista de detalle del evento "Hamlet"
      Y ha seleccionado el tier "VIP" con cantidad 2
    Cuando hace click en "Agregar al carrito"
    Entonces se crea una reserva en el sistema de ticketing
      Y el item aparece en el carrito con título "Hamlet", tier "VIP", cantidad 2 y precio unitario
      Y se muestra un toast de confirmación "Agregado al carrito"
      Y el badge del ícono de carrito en la barra de navegación muestra "1"

  @happy-path @critico @HU-CART-01
  Escenario: CRITERIO-1.2 — Carrito con items de múltiples eventos
    Dado que el comprador ya tiene "Hamlet — VIP x2" en el carrito
    Cuando navega al evento "Romeo y Julieta", selecciona "General x1" y hace click en "Agregar al carrito"
    Entonces el carrito contiene 2 items de eventos distintos
      Y el resumen muestra la suma de ambos subtotales
      Y el badge del ícono de carrito muestra "2"

  @happy-path @smoke @critico @HU-CART-01
  Escenario: CRITERIO-1.3 — Persistencia tras navegación y recarga
    Dado que el comprador tiene 2 items en el carrito
    Cuando navega a la cartelera de eventos
      Y luego recarga la página del navegador
    Entonces los 2 items siguen presentes en el carrito con toda su información
      Y el badge sigue mostrando "2"

  @error-path @HU-CART-01
  Escenario: CRITERIO-1.4 — Duplicado de evento y tier rechazado
    Dado que el comprador ya tiene "Hamlet — VIP" en el carrito
    Cuando intenta agregar "Hamlet — VIP" nuevamente
    Entonces se muestra un mensaje "Ya tienes este tier en tu carrito"
      Y el item existente no se duplica
      Y se ofrece la opción de ir al carrito

  @error-path @HU-CART-01
  Escenario: CRITERIO-1.5 — Error de creación de reserva
    Dado que el comprador intenta agregar un item al carrito
    Cuando la creación de la reserva falla por falta de capacidad
    Entonces se muestra el mensaje de error "No hay capacidad disponible"
      Y el item no se agrega al carrito
      Y el badge del carrito no cambia

  @edge-case @HU-CART-01
  Escenario: CRITERIO-1.6 — Límite de 5 items en el carrito
    Dado que el comprador tiene 5 items en el carrito
    Cuando intenta agregar un sexto item
    Entonces se muestra un mensaje "Máximo 5 reservas simultáneas permitidas"
      Y no se crea reserva en el sistema
      Y el carrito mantiene exactamente 5 items

  # ═══════════════════════════════════════════════════════
  # HU-CART-02: Vista de carrito de compras
  # ═══════════════════════════════════════════════════════

  @happy-path @smoke @critico @HU-CART-02
  Escenario: CRITERIO-2.1 — Vista completa de items del carrito
    Dado que el comprador tiene 3 items en el carrito
    Cuando navega a la vista del carrito
    Entonces se muestran 3 tarjetas con: imagen del evento, título, fecha, venue, tier, cantidad, precio unitario y subtotal
      Y cada tarjeta muestra un countdown en tiempo real
      Y se muestra un panel de resumen con subtotal general, tarifas de servicio y total

  @happy-path @critico @HU-CART-02
  Escenario: CRITERIO-2.2 — Countdown en tiempo real por item
    Dado que un item del carrito tiene una reserva que expira en 5 minutos
    Cuando pasan 60 segundos
    Entonces el countdown de ese item muestra "04:00"
      Y cada item mantiene su propio countdown independiente

  @happy-path @critico @HU-CART-02
  Escenario: CRITERIO-2.3 — Pago de un item individual
    Dado que el comprador tiene 2 items activos en el carrito
    Cuando hace click en "Pagar" en el primer item
    Entonces es redirigido a la vista de checkout con los datos de la reserva precargados
      Y al completar el pago exitosamente, el item se remueve del carrito

  @error-path @HU-CART-02
  Escenario: CRITERIO-2.4 — Item expirado marcado visualmente
    Dado que un item en el carrito tiene una reserva que ya expiró
    Cuando el comprador visita la vista del carrito
    Entonces el item se muestra con opacidad reducida y un badge "Expirado" en rojo
      Y el botón "Pagar" de ese item está deshabilitado
      Y se ofrece un botón "Renovar reserva"

  @error-path @HU-CART-02
  Escenario: CRITERIO-2.5 — Renovar reserva expirada
    Dado que un item está marcado como expirado en el carrito
    Cuando el comprador hace click en "Renovar reserva"
    Entonces se crea una nueva reserva con el mismo evento y tier
      Y el item se actualiza con el nuevo identificador de reserva y fecha de expiración
      Y el countdown se reinicia

  @edge-case @HU-CART-02
  Escenario: CRITERIO-2.6 — Carrito vacío
    Dado que el comprador no tiene items en el carrito
    Cuando navega a la vista del carrito
    Entonces se muestra un estado vacío con mensaje "Tu carrito está vacío"
      Y un botón "Explorar cartelera" que redirige a la cartelera de eventos

  @edge-case @HU-CART-02
  Escenario: CRITERIO-2.7 — Eliminación de item con confirmación
    Dado que el comprador tiene 3 items en el carrito
    Cuando hace click en eliminar un item y confirma la acción
    Entonces el item se remueve del carrito
      Y el total se recalcula
      Y el badge de la barra de navegación se actualiza

  # ═══════════════════════════════════════════════════════
  # HU-CART-03: Integración del carrito en el NavBar
  # ═══════════════════════════════════════════════════════

  @happy-path @smoke @HU-CART-03
  Escenario: CRITERIO-3.1 — Ícono de carrito navega a la vista del carrito
    Dado que el comprador está en cualquier vista pública de la aplicación
    Cuando hace click en el ícono de carrito de la barra de navegación
    Entonces es redirigido a la vista del carrito

  @happy-path @critico @HU-CART-03
  Escenario: CRITERIO-3.2 — Badge con conteo de items activos
    Dado que el comprador tiene 3 items activos en el carrito
    Cuando la barra de navegación se renderiza
    Entonces el ícono de carrito muestra un badge circular con "3" en color dorado
      Y el badge se actualiza en tiempo real al agregar o remover items

  @happy-path @HU-CART-03
  Escenario: CRITERIO-3.3 — Badge oculto con carrito vacío
    Dado que el comprador no tiene items activos en el carrito
    Cuando la barra de navegación se renderiza
    Entonces el ícono de carrito se muestra sin badge

  @edge-case @HU-CART-03
  Escenario: CRITERIO-3.4 — Enlace "Mis Tickets" reubicado
    Dado que el ícono de carrito apunta a la vista del carrito
    Cuando el comprador desea ver sus tickets comprados
    Entonces existe un enlace "Mis Tickets" accesible desde el menú de navegación
      Y el enlace redirige a la vista de tickets comprados

  # ═══════════════════════════════════════════════════════
  # HU-CART-04: Restaurar contexto de checkout desde el carrito
  # ═══════════════════════════════════════════════════════

  @happy-path @smoke @critico @HU-CART-04
  Escenario: CRITERIO-4.1 — Checkout restaurado con datos del carrito
    Dado que el comprador tiene un item en el carrito con reserva válida
    Cuando hace click en "Pagar" en la vista del carrito
    Entonces es redirigido al checkout del evento correspondiente
      Y la vista muestra: tier, precio, cantidad y countdown precargados
      Y el countdown muestra el tiempo restante calculado desde la expiración de la reserva

  @happy-path @critico @HU-CART-04
  Escenario: CRITERIO-4.2 — Pago exitoso remueve item del carrito
    Dado que el comprador restauró un item del carrito y completa el pago exitosamente
    Cuando se muestra la pantalla de éxito
    Entonces el item se remueve automáticamente del carrito
      Y el badge de la barra de navegación se decrementa
      Y el ticket queda guardado correctamente

  @happy-path @HU-CART-04
  Escenario: CRITERIO-4.3 — Email pre-rellenado
    Dado que el comprador ingresó su email al agregar un item al carrito
    Cuando restaura el checkout desde el carrito
    Entonces el campo de email muestra el valor previamente ingresado
      Y el comprador puede modificarlo antes de pagar

  @error-path @HU-CART-04
  Escenario: CRITERIO-4.4 — Pago fallido preserva item en carrito
    Dado que el comprador restauró un item del carrito
    Cuando el pago es rechazado
    Entonces el item permanece en el carrito
      Y el comprador puede reintentar el pago hasta 3 veces sin perder el item

  @error-path @critico @HU-CART-04
  Escenario: CRITERIO-4.5 — Reserva expira durante checkout restaurado
    Dado que el comprador restauró un item con 2 minutos restantes de reserva
    Cuando el countdown llega a cero
    Entonces se muestra una notificación de expiración
      Y el item se marca como expirado en el carrito
      Y se ofrece la opción de volver al carrito

  @edge-case @HU-CART-04
  Escenario: CRITERIO-4.6 — Volver al carrito desde checkout restaurado
    Dado que el comprador está en un checkout restaurado desde el carrito
    Cuando hace click en "Volver al carrito"
    Entonces regresa a la vista del carrito
      Y el item mantiene su estado actual sin pérdida de datos

  # ═══════════════════════════════════════════════════════
  # HU-CART-05: Alertas de expiración de items del carrito
  # ═══════════════════════════════════════════════════════

  @happy-path @critico @HU-CART-05
  Escenario: CRITERIO-5.1 — Alerta de expiración próxima
    Dado que el comprador tiene un item cuya reserva expira en menos de 2 minutos
      Y el comprador no está en el checkout de ese item
    Cuando el sistema detecta que quedan menos de 2 minutos
    Entonces se muestra una notificación "Tu reserva para [Evento] — [Tier] expira en menos de 2 minutos"
      Y la notificación incluye un enlace para proceder al pago

  @happy-path @critico @HU-CART-05
  Escenario: CRITERIO-5.2 — Marcado automático de items expirados
    Dado que un item en el carrito tiene su fecha de expiración en el pasado
    Cuando el sistema lo detecta en el siguiente ciclo de verificación
    Entonces el item se marca como expirado en el estado del carrito
      Y el badge de la barra de navegación refleja solo items activos

  @error-path @HU-CART-05
  Escenario: CRITERIO-5.3 — Notificación post-expiración
    Dado que un item acaba de expirar en el carrito
    Cuando el sistema lo detecta
    Entonces se muestra una notificación "Tu reserva para [Evento] — [Tier] ha expirado. Puedes renovarla desde el carrito."
      Y la notificación incluye un enlace al carrito

  @edge-case @HU-CART-05
  Escenario: CRITERIO-5.4 — Alerta no se repite para el mismo item
    Dado que el sistema ya alertó sobre un item próximo a expirar
    Cuando el siguiente ciclo de verificación detecta el mismo item con menos de 2 minutos
    Entonces no se emite una nueva alerta para ese item
      Y el flag de alerta previene notificaciones duplicadas
```

---

## Esquemas de Escenarios — Validaciones de Entrada

```gherkin
#language: es

  @error-path @validacion
  Esquema del escenario: Validar respuesta de error al crear reserva
    Dado que el comprador intenta agregar un item al carrito
    Cuando la reserva falla con código "<codigo>"
    Entonces se muestra el mensaje "<mensaje>"
      Y el item no se agrega al carrito

    Ejemplos:
      | codigo | mensaje                                |
      | 409    | No hay capacidad disponible             |
      | 404    | Evento o tier no encontrado              |
      | 500    | Error del servidor, intenta más tarde    |

  @edge-case @validacion
  Esquema del escenario: Validar cálculo de subtotal por tier
    Dado que el comprador agrega un item con tier "<tier>" a precio "<precio>" con cantidad "<cantidad>"
    Cuando el carrito calcula el subtotal
    Entonces el subtotal del item es "<subtotal>"
      Y la tarifa de servicio es "$10.000"
      Y el total individual es "<total>"

    Ejemplos:
      | tier       | precio   | cantidad | subtotal  | total     |
      | VIP        | $150.000 | 2        | $300.000  | $310.000  |
      | GENERAL    | $50.000  | 4        | $200.000  | $210.000  |
      | EARLY_BIRD | $80.000  | 1        | $80.000   | $90.000   |
```

---

## Datos de Prueba Sintéticos

### Eventos de prueba

| Campo | Evento 1 | Evento 2 | Evento 3 |
|-------|----------|----------|----------|
| eventId | `evt-001-test` | `evt-002-test` | `evt-003-test` |
| eventTitle | Hamlet | Romeo y Julieta | El Fantasma de la Ópera |
| eventDate | 2026-04-15T20:00:00Z | 2026-04-20T19:00:00Z | 2026-04-25T21:00:00Z |
| eventRoom | Sala Principal | Sala Secundaria | Gran Teatro |
| eventImageUrl | `/images/hamlet.jpg` | `/images/romeo.jpg` | `/images/fantasma.jpg` |

### Tiers de prueba

| Campo | VIP | General | Early Bird |
|-------|-----|---------|------------|
| tierId | `tier-vip-001` | `tier-gen-001` | `tier-eb-001` |
| tierType | VIP | GENERAL | EARLY_BIRD |
| tierPrice | 150000 | 50000 | 80000 |

### Items de carrito

| Escenario | Item | quantity | validUntilAt | expired | expirationAlerted |
|-----------|------|----------|--------------|---------|-------------------|
| Carrito normal | Hamlet VIP x2 | 2 | now + 10min | false | false |
| Item múltiple | Romeo General x1 | 1 | now + 8min | false | false |
| Próximo a expirar | Fantasma VIP x3 | 3 | now + 1min | false | false |
| Expirado | Hamlet General x1 | 1 | now - 5min | true | true |
| Ya alertado | Romeo VIP x2 | 2 | now + 90s | false | true |

### Datos para validación de límites

| Caso | Items en carrito | Acción | Resultado esperado |
|------|-----------------|--------|-------------------|
| Bajo límite | 3 | Agregar 1 | Éxito (4 items) |
| En límite | 5 | Agregar 1 | Rechazado: "Máximo 5 reservas" |
| Duplicado | Hamlet VIP existe | Agregar Hamlet VIP | Rechazado: "Ya tienes este tier" |
| Mismo evento, otro tier | Hamlet VIP existe | Agregar Hamlet General | Éxito |

### Datos para cálculo de totales

| Items | Subtotal Individual | Service Fee | Total |
|-------|-------------------|-------------|-------|
| VIP x2 ($150.000) | $300.000 | $10.000 | $310.000 |
| General x1 ($50.000) | $50.000 | $10.000 | $60.000 |
| **Carrito completo** | **$350.000** | **$20.000** | **$370.000** |

---

## Trazabilidad Criterios → Escenarios → Tests

| Criterio | Escenario Gherkin | Test Unitario (archivo) | Cubierto |
|----------|-------------------|------------------------|----------|
| CRITERIO-1.1 | Item agregado exitosamente | CartContext.test.tsx | ✅ |
| CRITERIO-1.2 | Items de múltiples eventos | CartContext.test.tsx | ✅ |
| CRITERIO-1.3 | Persistencia tras recarga | cartService.test.ts, CartContext.test.tsx | ✅ |
| CRITERIO-1.4 | Duplicado rechazado | CartContext.test.tsx | ✅ |
| CRITERIO-1.5 | Error de creación de reserva | EventDetailCart.test.tsx | ✅ |
| CRITERIO-1.6 | Límite de 5 items | CartContext.test.tsx | ✅ |
| CRITERIO-2.1 | Vista completa de items | CartPage.test.tsx, CartItemCard.test.tsx | ✅ |
| CRITERIO-2.2 | Countdown en tiempo real | CartItemCard.test.tsx | ✅ |
| CRITERIO-2.3 | Pago individual | CartPage.test.tsx | ✅ |
| CRITERIO-2.4 | Item expirado visual | CartItemCard.test.tsx | ✅ |
| CRITERIO-2.5 | Renovar reserva | CartPage.test.tsx | ✅ |
| CRITERIO-2.6 | Carrito vacío | CartPage.test.tsx | ✅ |
| CRITERIO-2.7 | Eliminación con confirmación | CartItemCard.test.tsx | ✅ |
| CRITERIO-3.1 | Ícono navega a carrito | NavBarCart.test.tsx | ✅ |
| CRITERIO-3.2 | Badge con conteo | CartBadge.test.tsx | ✅ |
| CRITERIO-3.3 | Badge oculto | CartBadge.test.tsx | ✅ |
| CRITERIO-3.4 | Mis Tickets reubicado | NavBarCart.test.tsx | ✅ |
| CRITERIO-4.1 | Checkout restaurado | EventDetailCart.test.tsx | ✅ |
| CRITERIO-4.2 | Pago exitoso remueve item | EventDetailCart.test.tsx | ✅ |
| CRITERIO-4.3 | Email pre-rellenado | EventDetailCart.test.tsx | ✅ |
| CRITERIO-4.4 | Pago fallido preserva item | EventDetailCart.test.tsx | ✅ |
| CRITERIO-4.5 | Reserva expira en checkout | EventDetailCart.test.tsx | ✅ |
| CRITERIO-4.6 | Volver al carrito | EventDetailCart.test.tsx | ✅ |
| CRITERIO-5.1 | Alerta expiración próxima | useCartExpirationWatcher.test.ts | ✅ |
| CRITERIO-5.2 | Marcado automático expirados | useCartExpirationWatcher.test.ts | ✅ |
| CRITERIO-5.3 | Notificación post-expiración | useCartExpirationWatcher.test.ts | ✅ |
| CRITERIO-5.4 | Alerta no se repite | useCartExpirationWatcher.test.ts | ✅ |

**Cobertura: 22/22 criterios (100%)** — Todos los criterios de aceptación tienen escenario Gherkin y test unitario asociado.
