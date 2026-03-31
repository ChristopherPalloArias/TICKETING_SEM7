---
id: SPEC-019
status: IMPLEMENTED
feature: carrito-compras
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.0"
related-specs: [SPEC-004, SPEC-010, SPEC-017]
---

# Spec: Carrito de Compras Multi-Evento

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Implementar un carrito de compras persistente en el frontend que permita al comprador agregar entradas de múltiples eventos, navegar libremente por la aplicación sin perder los items, revisar un resumen centralizado en `/carrito`, proceder al checkout individual de cada item, y recibir alertas de expiración. El carrito es una **capa de agregación de presentación** — no existe un recurso "carrito" en el backend; las reservas se crean y pagan individualmente vía `ms-ticketing`.

### Requerimiento de Negocio

El flujo actual obliga al comprador a completar cada compra de forma aislada dentro de `EventDetail` sin poder navegar. Si sale de la vista, pierde toda la progresión (reservationId, tier, cantidad, timer). Esto causa pérdida de ventas para compradores multi-evento y una experiencia fragmentada. Se requiere un carrito persistente en localStorage que desacople la selección de entradas del pago inmediato.

**Fuente:** `.github/requirements/carrito-de-compras.md`
**Capas afectadas:** Frontend únicamente
**Dependencias:** HU-04 (ms-ticketing — reservas), SPEC-010 (checkout-pago-frontend), SPEC-017 (notificaciones-in-app)
**Stack:** React · TypeScript · CSS Modules · Vite · Axios · React Router · localStorage

### Historias de Usuario

#### HU-CART-01: Agregar items al carrito desde el detalle de evento

```
Como:        Comprador
Quiero:      Agregar entradas de un evento a un carrito de compras sin completar el pago inmediatamente
Para:        Poder seguir navegando por la cartelera y agregar entradas de otros eventos antes de pagar

Prioridad:   Alta
Estimación:  L (8 SP)
Dependencias: HU-04 (reservas backend)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-CART-01

**Happy Path**
```gherkin
CRITERIO-1.1: Item agregado exitosamente al carrito
  Dado que:  el comprador está en la vista de detalle de un evento con tier "VIP" seleccionado y cantidad 2
  Cuando:    hace click en "Agregar al carrito"
  Entonces:  se crea una reserva en el backend (POST /api/v1/reservations)
    Y el item se agrega al carrito con: eventId, eventTitle, eventDate, eventRoom, eventImageUrl, tierId, tierType, tierPrice, quantity, reservationId, validUntilAt, addedAt
    Y se muestra un toast de confirmación "Agregado al carrito"
    Y el badge del ícono de carrito en el NavBar se incrementa

CRITERIO-1.2: Carrito con items de múltiples eventos
  Dado que:  el comprador ya tiene "Hamlet — VIP x2" en el carrito
  Cuando:    navega al evento "Romeo y Julieta", selecciona "General x1" y hace click en "Agregar al carrito"
  Entonces:  el carrito contiene 2 items de eventos distintos
    Y el total muestra la suma de ambos subtotales

CRITERIO-1.3: Persistencia tras navegación y recarga
  Dado que:  el comprador tiene 2 items en el carrito
  Cuando:    navega a la cartelera, a venues o recarga la página
  Entonces:  los 2 items siguen presentes con toda su información
```

**Error Path**
```gherkin
CRITERIO-1.4: Duplicado de evento+tier rechazado
  Dado que:  el comprador ya tiene "Hamlet — VIP" en el carrito
  Cuando:    intenta agregar "Hamlet — VIP" nuevamente
  Entonces:  se muestra un mensaje "Ya tienes este tier en tu carrito"
    Y el item existente no se duplica
    Y se ofrece la opción de ir al carrito para modificar

CRITERIO-1.5: Error de creación de reserva
  Dado que:  el comprador intenta agregar un item al carrito
  Cuando:    la llamada POST /api/v1/reservations falla (409 sin capacidad, 404 no encontrado)
  Entonces:  se muestra el mensaje de error apropiado
    Y el item NO se agrega al carrito
```

**Edge Case**
```gherkin
CRITERIO-1.6: Límite de 5 items en el carrito
  Dado que:  el comprador tiene 5 items en el carrito
  Cuando:    intenta agregar un sexto item
  Entonces:  se muestra un mensaje "Máximo 5 reservas simultáneas permitidas"
    Y el item no se agrega
    Y no se crea reserva en el backend
```

---

#### HU-CART-02: Vista de carrito de compras

```
Como:        Comprador
Quiero:      Ver una lista consolidada de todas las entradas en mi carrito con tiempos restantes
Para:        Revisar mi selección, eliminar items no deseados y proceder al pago de los que desee

Prioridad:   Alta
Estimación:  L (8 SP)
Dependencias: HU-CART-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-CART-02

**Happy Path**
```gherkin
CRITERIO-2.1: Vista completa de items del carrito
  Dado que:  el comprador tiene 3 items en el carrito
  Cuando:    navega a /carrito
  Entonces:  se muestran 3 tarjetas de item con: imagen del evento, título, fecha, venue, tier, cantidad, precio unitario, subtotal, countdown en tiempo real
    Y se muestra un panel de resumen con subtotal general, tarifas de servicio ($10.000 × reservas) y total

CRITERIO-2.2: Countdown en tiempo real por item
  Dado que:  un item tiene reserva que expira en 5 minutos
  Cuando:    pasan 60 segundos
  Entonces:  el countdown de ese item muestra 04:00
    Y cada item tiene su propio countdown independiente basado en validUntilAt

CRITERIO-2.3: Pago de un item individual
  Dado que:  el comprador tiene 2 items activos en el carrito
  Cuando:    hace click en "Pagar" en el primer item
  Entonces:  es redirigido a /eventos/:eventId con estado de checkout restaurado
    Y al completar el pago, el item se remueve del carrito automáticamente
```

**Error Path**
```gherkin
CRITERIO-2.4: Item expirado marcado visualmente
  Dado que:  un item en el carrito tiene validUntilAt < ahora
  Cuando:    el comprador visita /carrito
  Entonces:  el item se muestra con opacidad reducida y badge "Expirado" en rojo
    Y el botón "Pagar" de ese item está deshabilitado
    Y se ofrece un botón "Renovar reserva"

CRITERIO-2.5: Renovar reserva expirada
  Dado que:  un item está marcado como expirado en el carrito
  Cuando:    el comprador hace click en "Renovar reserva"
  Entonces:  se crea una nueva reserva (POST /api/v1/reservations) con el mismo eventId + tierId
    Y el item se actualiza con el nuevo reservationId y validUntilAt
    Y el countdown se reinicia
```

**Edge Case**
```gherkin
CRITERIO-2.6: Carrito vacío
  Dado que:  el comprador no tiene items en el carrito
  Cuando:    navega a /carrito
  Entonces:  se muestra un estado vacío con ilustración, mensaje "Tu carrito está vacío" y botón "Explorar cartelera" que redirige a /eventos

CRITERIO-2.7: Eliminación de item con confirmación
  Dado que:  el comprador ve 3 items en el carrito
  Cuando:    hace click en eliminar (X) de un item y confirma
  Entonces:  el item se remueve del carrito, el total se recalcula y el badge del NavBar se actualiza
```

---

#### HU-CART-03: Integración del carrito en el NavBar

```
Como:        Comprador
Quiero:      Ver un ícono de carrito con badge de conteo en la barra de navegación
Para:        Acceder rápidamente a mi carrito desde cualquier vista de la aplicación

Prioridad:   Alta
Estimación:  S (3 SP)
Dependencias: HU-CART-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-CART-03

**Happy Path**
```gherkin
CRITERIO-3.1: Ícono de carrito navega a /carrito
  Dado que:  el comprador está en cualquier vista pública
  Cuando:    hace click en el ícono de carrito del NavBar
  Entonces:  es redirigido a /carrito (ya no a /mis-tickets)

CRITERIO-3.2: Badge con conteo de items activos
  Dado que:  el comprador tiene 3 items activos (no expirados) en el carrito
  Cuando:    el NavBar se renderiza
  Entonces:  el ícono de carrito muestra un badge circular con "3" en color dorado/gold
    Y el badge se actualiza en tiempo real al agregar o remover items

CRITERIO-3.3: Badge oculto con carrito vacío
  Dado que:  el comprador no tiene items activos en el carrito
  Cuando:    el NavBar se renderiza
  Entonces:  el ícono de carrito se muestra sin badge
```

**Edge Case**
```gherkin
CRITERIO-3.4: Enlace "Mis Tickets" reubicado
  Dado que:  el ícono de carrito ya no apunta a /mis-tickets
  Cuando:    el comprador desea ver sus tickets comprados
  Entonces:  existe un enlace "Mis Tickets" accesible desde el menú de navegación o la vista del carrito
    Y el enlace redirige a /mis-tickets
```

---

#### HU-CART-04: Restaurar contexto de checkout desde el carrito

```
Como:        Comprador
Quiero:      Que al hacer click en "Pagar" desde el carrito se restaure el flujo de checkout con los datos de mi reserva
Para:        Completar el pago sin tener que seleccionar el tier ni ingresar mis datos de nuevo

Prioridad:   Alta
Estimación:  M (5 SP)
Dependencias: HU-CART-01, HU-CART-02, SPEC-010
Capa:        Frontend
```

#### Criterios de Aceptación — HU-CART-04

**Happy Path**
```gherkin
CRITERIO-4.1: Checkout restaurado con datos del carrito
  Dado que:  el comprador tiene un item en el carrito con reservationId válido
  Cuando:    hace click en "Pagar" en la vista del carrito
  Entonces:  es redirigido a /eventos/:eventId
    Y la vista se posiciona en la pantalla de checkout con: reservationId, tierId, tierType, tierPrice, quantity precargados
    Y el countdown muestra el tiempo restante calculado desde validUntilAt

CRITERIO-4.2: Pago exitoso remueve item del carrito
  Dado que:  el comprador restauró un item del carrito y completa el pago con resultado CONFIRMED
  Cuando:    se muestra la pantalla de éxito
  Entonces:  el item se remueve automáticamente del carrito
    Y el badge del NavBar se decrementa
    Y el ticket se guarda en localStorage normalmente

CRITERIO-4.3: Email pre-rellenado
  Dado que:  el comprador ingresó su email al agregar el item al carrito
  Cuando:    restaura el checkout desde el carrito
  Entonces:  el campo de email muestra el valor previamente ingresado
    Y el comprador puede modificarlo antes de pagar
```

**Error Path**
```gherkin
CRITERIO-4.4: Pago fallido preserva item en carrito
  Dado que:  el comprador restauró un item del carrito y el pago fue rechazado
  Cuando:    se muestra la pantalla de error con opción de reintento
  Entonces:  el item permanece en el carrito
    Y el comprador puede reintentar (máximo 3 veces) sin perder el item

CRITERIO-4.5: Reserva expira durante checkout restaurado
  Dado que:  el comprador restauró un item con 2 minutos restantes
  Cuando:    el timer llega a 0
  Entonces:  se muestra notificación de expiración
    Y el item se marca como expirado en el carrito
    Y se ofrece opción de volver al carrito
```

**Edge Case**
```gherkin
CRITERIO-4.6: Volver al carrito desde checkout restaurado
  Dado que:  el comprador está en un checkout restaurado desde el carrito
  Cuando:    hace click en "Volver al carrito" o en el ícono del NavBar
  Entonces:  regresa a /carrito y el item mantiene su estado actual
```

---

#### HU-CART-05: Alertas de expiración de items del carrito

```
Como:        Comprador
Quiero:      Recibir alertas cuando un item del carrito esté por expirar o haya expirado
Para:        Tomar acción antes de perder la reserva y poder renovarla a tiempo

Prioridad:   Media
Estimación:  S (3 SP)
Dependencias: HU-CART-01, SPEC-017 (notificaciones-in-app)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-CART-05

**Happy Path**
```gherkin
CRITERIO-5.1: Alerta de expiración próxima (< 2 minutos)
  Dado que:  el comprador tiene un item cuya reserva expira en menos de 2 minutos
    Y el comprador NO está en el checkout de ese item
  Cuando:    el sistema detecta que quedan < 2 minutos
  Entonces:  se muestra una notificación toast: "Tu reserva para [Evento] — [Tier] expira en menos de 2 minutos"
    Y la notificación incluye un link para proceder al pago

CRITERIO-5.2: Marcado automático de items expirados
  Dado que:  un item en el carrito tiene validUntilAt < ahora
  Cuando:    el sistema lo detecta (interval cada 30 segundos)
  Entonces:  el item se marca como expirado en el estado del carrito
    Y el badge del NavBar refleja solo items activos
```

**Error Path**
```gherkin
CRITERIO-5.3: Notificación post-expiración
  Dado que:  un item acaba de expirar en el carrito
  Cuando:    el sistema lo detecta
  Entonces:  se muestra notificación: "Tu reserva para [Evento] — [Tier] ha expirado. Puedes renovarla desde el carrito."
    Y la notificación incluye un link al carrito
```

**Edge Case**
```gherkin
CRITERIO-5.4: Alerta no se repite para el mismo item
  Dado que:  el sistema ya alertó sobre un item próximo a expirar
  Cuando:    el siguiente ciclo de verificación detecta el mismo item con < 2 minutos
  Entonces:  NO se emite una nueva alerta (flag expirationAlerted previene duplicados)
```

### Reglas de Negocio

1. **Carrito es frontend-only**: No existe recurso "carrito" en el backend. El carrito es una capa de agregación sobre reservas individuales de `ms-ticketing`.
2. **Reservas individuales**: Cada item del carrito tiene su propio `reservationId` creado vía `POST /api/v1/reservations`. Los pagos se procesan reserva por reserva.
3. **TTL de reservas**: ~10 minutos por reserva (controlado por el backend). El frontend calcula el countdown a partir de `validUntilAt`.
4. **Máximo 5 items**: El carrito acepta un máximo de 5 reservas simultáneas.
5. **Sin duplicados**: No se permite el mismo `eventId + tierId` dos veces en el carrito.
6. **Persistencia en localStorage**: Key `sem7_shopping_cart`. Datos sobreviven navegación y recarga de página.
7. **Items expirados no cuentan**: El badge del NavBar y el conteo solo incluyen items activos (`validUntilAt > ahora`).
8. **Renovación**: Un item expirado puede renovarse creando una nueva reserva con el mismo `eventId + tierId`.
9. **Pago exitoso limpia item**: Al confirmar pago (`CONFIRMED`), el item se remueve del carrito automáticamente.
10. **Tarifa de servicio**: $10.000 por reserva, consistente con el flujo de checkout existente.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `CartItem` | localStorage (`sem7_shopping_cart`) | nueva | Item individual del carrito con datos de evento, tier y reserva |
| `CartState` | React Context (CartContext) | nueva | Estado global del carrito: items, operaciones CRUD |

#### Campos del modelo — CartItem
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `id` | string | sí | UUID auto-generado | Identificador único del item en el carrito |
| `eventId` | string | sí | UUID del evento | ID del evento asociado |
| `eventTitle` | string | sí | — | Título del evento para display |
| `eventDate` | string | sí | ISO 8601 | Fecha del evento |
| `eventRoom` | string | sí | — | Nombre del venue/sala |
| `eventImageUrl` | string | no | URL | Imagen del poster del evento |
| `tierId` | string | sí | UUID del tier | ID del tier seleccionado |
| `tierType` | TierType | sí | `VIP` \| `GENERAL` \| `EARLY_BIRD` | Tipo de tier |
| `tierPrice` | number | sí | > 0 | Precio unitario del tier |
| `quantity` | number | sí | 1–10 | Cantidad de entradas |
| `reservationId` | string | sí | UUID de la reserva | ID de la reserva creada en ms-ticketing |
| `validUntilAt` | string | sí | ISO 8601 | Timestamp de expiración de la reserva |
| `email` | string | no | formato email | Email del comprador (opcional al agregar) |
| `addedAt` | string | sí | ISO 8601 | Timestamp de cuándo se agregó al carrito |
| `expired` | boolean | sí | default `false` | Si la reserva ha expirado |
| `expirationAlerted` | boolean | sí | default `false` | Si ya se envió alerta de expiración próxima |

#### Constraints
- Unicidad: `eventId + tierId` no puede repetirse dentro del carrito
- Máximo: 5 items por carrito
- localStorage key: `sem7_shopping_cart`

### API Endpoints

> **No se crean endpoints nuevos.** El carrito es frontend-only. Se reutilizan los endpoints existentes de `ms-ticketing`:

#### POST /api/v1/reservations (existente — ms-ticketing)
- **Uso en carrito**: Crear reserva al agregar item al carrito
- **Request Body**:
  ```json
  { "eventId": "uuid", "tierId": "uuid" }
  ```
- **Headers**: `X-User-Id: <buyerId>`
- **Response 201**:
  ```json
  {
    "id": "uuid",
    "eventId": "uuid",
    "tierId": "uuid",
    "buyerId": "uuid",
    "status": "PENDING",
    "createdAt": "iso8601",
    "updatedAt": "iso8601",
    "validUntilAt": "iso8601"
  }
  ```
- **Response 404**: Evento o tier no encontrado
- **Response 409**: Sin capacidad disponible en el tier

#### POST /api/v1/reservations/{reservationId}/payments (existente — ms-ticketing)
- **Uso en carrito**: Procesar pago de un item individual del carrito
- **Request Body**:
  ```json
  { "amount": 110000, "status": "APPROVED" }
  ```
- **Headers**: `X-User-Id: <buyerId>`
- **Response 200**:
  ```json
  {
    "status": "CONFIRMED",
    "ticketId": "uuid",
    "ticket": { ... }
  }
  ```
- **Response 400**: Reserva expirada o ya pagada
- **Response 404**: Reserva no encontrada

### Diseño Frontend

#### Tipos nuevos
| Tipo | Archivo | Descripción |
|------|---------|-------------|
| `CartItem` | `types/cart.types.ts` | Interfaz del item del carrito |
| `CartContextValue` | `types/cart.types.ts` | Interfaz del contexto del carrito |

#### Componentes nuevos
| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `CartItemCard` | `components/Cart/CartItemCard.tsx` | `item: CartItem, onPay, onRemove, onRenew` | Tarjeta de un item del carrito con countdown |
| `CartSummary` | `components/Cart/CartSummary.tsx` | `items: CartItem[]` | Panel de resumen: subtotales, service fee, total |
| `CartBadge` | `components/Cart/CartBadge.tsx` | `count: number` | Badge circular sobre ícono de carrito |

#### Páginas nuevas
| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `CartPage` | `pages/CartPage/CartPage.tsx` | `/carrito` | no (pública) |

#### Hooks y State
| Hook/Context | Archivo | Retorna | Descripción |
|--------------|---------|---------|-------------|
| `CartContext` + `CartProvider` | `contexts/CartContext.tsx` | `{ items, addItem, removeItem, updateItem, clearCart, activeItemCount }` | Estado global del carrito con persistencia en localStorage |
| `useCart` | `contexts/CartContext.tsx` | `CartContextValue` | Hook de acceso al contexto del carrito |
| `useCartExpirationWatcher` | `hooks/useCartExpirationWatcher.ts` | `void` | Interval (30s) que verifica expiración y emite alertas |

#### Services (llamadas API)
| Función | Archivo | Descripción |
|---------|---------|-------------|
| `getCartItems()` | `services/cartService.ts` | Lee items del localStorage |
| `saveCartItems(items)` | `services/cartService.ts` | Persiste items al localStorage |
| `addCartItem(item)` | `services/cartService.ts` | Agrega item validando duplicados y límite |
| `removeCartItem(itemId)` | `services/cartService.ts` | Remueve item por ID |
| `updateCartItem(itemId, updates)` | `services/cartService.ts` | Actualiza campos de un item |
| `clearCart()` | `services/cartService.ts` | Vacía el carrito |

> Las llamadas al backend para crear reservas y procesar pagos siguen usando `reservationService.ts` existente.

#### Flujo de datos

```
[EventDetail] → "Agregar al carrito"
    ↓
createReservation(eventId, tierId)  ← reservationService.ts (existente)
    ↓
CartContext.addItem(cartItem)  ← CartContext.tsx (nuevo)
    ↓
cartService.saveCartItems()  ← cartService.ts (nuevo) → localStorage

[CartPage] → "Pagar" en un item
    ↓
navigate(`/eventos/${eventId}`, { state: { fromCart: true, cartItem } })
    ↓
[EventDetail] lee location.state → restaura screen='checkout', order, timeLeft
    ↓
processPayment()  ← reservationService.ts (existente)
    ↓
CartContext.removeItem(cartItemId)  ← limpieza automática
```

#### Modificaciones a componentes existentes

| Componente | Archivo actual | Cambios |
|------------|---------------|---------|
| `NavBar` | `components/NavBar/NavBar.tsx` | Cambiar link de ShoppingCart de `/mis-tickets` a `/carrito`. Agregar `CartBadge` con `activeItemCount` del CartContext. Reubicar enlace "Mis Tickets" en menú. |
| `TicketPanel` | `components/TicketTier/TicketPanel.tsx` | Agregar botón "Agregar al carrito" junto a "Reservar" |
| `EventDetail` | `pages/EventDetail/EventDetail.tsx` | Leer `location.state` para restaurar checkout desde carrito. Al completar pago con `fromCart`, llamar `removeItem`. Agregar botón "Volver al carrito" cuando `fromCart === true`. |
| `App.tsx` | `App.tsx` | Envolver app con `CartProvider`. Agregar ruta `/carrito` → `CartPage`. |

### Arquitectura y Dependencias

- **Paquetes nuevos requeridos**: ninguno (se usa React Context, localStorage y dependencias existentes)
- **Servicios externos**: ninguno nuevo
- **Impacto en punto de entrada**: `App.tsx` necesita `CartProvider` y ruta `/carrito`
- **Sin cambios en backend**: ms-ticketing, ms-events, ms-notifications y api-gateway no se modifican

### Notas de Implementación

1. **CartContext debe inicializarse leyendo localStorage** al montar, similar al patrón de `AuthContext` con `sem7_admin_session`.
2. **El countdown de cada item** se calcula como `validUntilAt - Date.now()` en milisegundos, NO con un timer estático de 599s como en `EventDetail`.
3. **Al restaurar checkout desde carrito**, el `timeLeft` debe recalcularse en tiempo real. Si `validUntilAt` ya pasó, ir directo a estado expirado.
4. **El botón "Agregar al carrito"** debe crear la reserva ANTES de agregar al carrito. Si la reserva falla, el item no entra al carrito.
5. **El ícono existente de ShoppingCart en NavBar** (línea 73 de NavBar.tsx) actualmente apunta a `/mis-tickets`. Se reasigna a `/carrito`.
6. **Tarifa de servicio**: $10.000 por reserva, consistente con `OrderSummary.tsx` que calcula `tierPrice × quantity + $10.000`.
7. **CSS Modules**: Todos los estilos nuevos deben usar `*.module.css`, siguiendo la convención del proyecto.
8. **Patrón de navegación con state**: Usar `useNavigate` con `{ state: { fromCart: true, cartItem: CartItem } }` para pasar datos al checkout restaurado. En `EventDetail`, leer con `useLocation().state`.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

> **No hay cambios en backend.** El carrito es frontend-only. Los endpoints de reservas y pagos ya existen en ms-ticketing.

- [ ] N/A — Verificar que `POST /api/v1/reservations` soporta múltiples reservas concurrentes del mismo buyer (ya funcional)

### Frontend

#### Implementación — Infraestructura del carrito (HU-CART-01)
- [ ] Crear `frontend/src/types/cart.types.ts` — interfaz `CartItem` y `CartContextValue`
- [ ] Crear `frontend/src/services/cartService.ts` — funciones CRUD sobre localStorage (key: `sem7_shopping_cart`)
- [ ] Crear `frontend/src/contexts/CartContext.tsx` — `CartProvider` + `useCart` hook con: items, addItem, removeItem, updateItem, clearCart, activeItemCount
- [ ] Envolver la app con `CartProvider` en `App.tsx`
- [ ] Agregar botón "Agregar al carrito" en `TicketPanel.tsx` junto al botón "Reservar"
- [ ] Implementar lógica: crear reserva → agregar item al carrito → mostrar toast de confirmación
- [ ] Validar duplicados por `eventId + tierId` antes de crear reserva
- [ ] Implementar límite de 5 items (validar antes de crear reserva)

#### Implementación — Vista del carrito (HU-CART-02)
- [ ] Crear `frontend/src/pages/CartPage/CartPage.tsx` — página principal del carrito
- [ ] Crear `frontend/src/pages/CartPage/CartPage.module.css` — estilos consistentes con Teatro Noir
- [ ] Crear `frontend/src/components/Cart/CartItemCard.tsx` — tarjeta de item con imagen, datos, countdown, acciones
- [ ] Crear `frontend/src/components/Cart/CartItemCard.module.css`
- [ ] Crear `frontend/src/components/Cart/CartSummary.tsx` — panel de resumen con subtotales, service fee, total
- [ ] Crear `frontend/src/components/Cart/CartSummary.module.css`
- [ ] Implementar countdown en tiempo real por item usando `validUntilAt`
- [ ] Implementar estilo de item expirado: opacidad reducida, badge "Expirado", botón pagar deshabilitado
- [ ] Implementar botón "Renovar reserva" que crea nueva reserva y actualiza el item
- [ ] Implementar eliminación de item con confirmación
- [ ] Implementar estado vacío con CTA "Explorar cartelera"
- [ ] Registrar ruta `/carrito` → `CartPage` en `App.tsx`

#### Implementación — NavBar (HU-CART-03)
- [ ] Crear `frontend/src/components/Cart/CartBadge.tsx` — badge circular con conteo
- [ ] Crear `frontend/src/components/Cart/CartBadge.module.css`
- [ ] Modificar `NavBar.tsx` — cambiar link de ShoppingCart de `/mis-tickets` a `/carrito`
- [ ] Consumir `activeItemCount` desde `useCart()` en NavBar y renderizar `CartBadge`
- [ ] Reubicar enlace "Mis Tickets" como link en menú o sección de navegación

#### Implementación — Restaurar checkout (HU-CART-04)
- [ ] Modificar `EventDetail.tsx` — leer `location.state` con datos del CartItem
- [ ] Si `location.state.fromCart === true`, inicializar: `screen = 'checkout'`, `selectedTierId`, `order` desde CartItem
- [ ] Calcular `timeLeft` a partir de `validUntilAt - Date.now()`
- [ ] Al completar pago (CONFIRMED) con `fromCart`, llamar `removeItem(cartItemId)` del CartContext
- [ ] Al expirar timer con `fromCart`, marcar item como expirado en CartContext
- [ ] Agregar botón "Volver al carrito" cuando `fromCart === true`
- [ ] Pre-rellenar email desde `cartItem.email` en CheckoutScreen

#### Implementación — Alertas de expiración (HU-CART-05)
- [ ] Crear `frontend/src/hooks/useCartExpirationWatcher.ts` — interval cada 30s verificando `validUntilAt`
- [ ] Cuando item tiene < 2 min restantes y `expirationAlerted === false`, disparar notificación vía `addNotification` de NotificationsContext
- [ ] Cuando item expira, marcar `expired = true` en CartContext y actualizar localStorage
- [ ] Emitir notificación post-expiración con link al carrito
- [ ] Activar el hook en `CartProvider` o en `App.tsx`

#### Tests Frontend
- [ ] `[CartContext] adds item to cart correctly`
- [ ] `[CartContext] rejects duplicate eventId+tierId`
- [ ] `[CartContext] enforces max 5 items limit`
- [ ] `[CartContext] removes item and updates count`
- [ ] `[CartContext] persists to localStorage`
- [ ] `[CartContext] loads items from localStorage on mount`
- [ ] `[cartService] getCartItems returns empty array for new key`
- [ ] `[cartService] saveCartItems persists to localStorage`
- [ ] `[CartItemCard] renders event info and countdown`
- [ ] `[CartItemCard] shows expired badge when item expired`
- [ ] `[CartItemCard] calls onPay when Pay button clicked`
- [ ] `[CartItemCard] calls onRemove when Remove button clicked`
- [ ] `[CartSummary] calculates subtotal and total correctly`
- [ ] `[CartPage] renders list of cart items`
- [ ] `[CartPage] shows empty state when no items`
- [ ] `[CartBadge] shows count when > 0`
- [ ] `[CartBadge] hidden when count is 0`
- [ ] `[NavBar] links cart icon to /carrito`
- [ ] `[useCartExpirationWatcher] marks expired items`
- [ ] `[useCartExpirationWatcher] emits alert at < 2 minutes`
- [ ] `[EventDetail] restores checkout from cart location state`

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CRITERIO-1.1 a CRITERIO-5.4
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar que todas las reglas de negocio están cubiertas
- [ ] Verificar persistencia del carrito tras navegación en distintos browsers
- [ ] Verificar que el countdown se sincroniza correctamente con `validUntilAt` del backend
- [ ] Verificar flujo completo: agregar → ver carrito → pagar → ticket generado → item removido
- [ ] Verificar renovación de reserva expirada
- [ ] Verificar límite de 5 items y duplicados
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
