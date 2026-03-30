# Requerimiento: Carrito de Compras Multi-Evento

## Contexto del feature

### Problema actual

El flujo de compra del sistema de ticketing está diseñado como un embudo lineal dentro de `EventDetail`: el comprador selecciona un tier, reserva, paga y obtiene su ticket — todo en una sola vista sin salir de ella. Si el comprador navega fuera de la vista (por ejemplo, para ver otro evento o explorar la cartelera), **pierde toda la progresión**: el `reservationId`, el tier seleccionado, la cantidad, el email, el timer y el estado de pantalla se destruyen porque viven en estado local del componente React.

Esto genera dos problemas de negocio:

1. **Pérdida de ventas:** Un comprador que quiere comparar eventos o comprar entradas para más de uno se ve obligado a completar cada compra de forma aislada antes de navegar. Si sale, debe empezar de cero.
2. **Experiencia fragmentada:** El ícono `ShoppingCart` en el NavBar dirige a `/mis-tickets` (tickets ya comprados), no a un carrito de compra. No existe una vista centralizada donde el comprador vea qué tiene pendiente de pagar.

### Solución propuesta

Implementar un **carrito de compras persistente** que permita al comprador:

- **Agregar items** (evento + tier + cantidad) desde distintos eventos sin perder los anteriores.
- **Navegar libremente** por la aplicación mientras el carrito retiene los items.
- **Ver un resumen** de todos los items pendientes en una vista dedicada `/carrito`.
- **Proceder al checkout** de cada item individualmente (ya que cada reserva es independiente en el backend).
- **Recibir alertas** cuando un item en el carrito esté por expirar o haya expirado.

### Restricciones del backend

El backend (`ms-ticketing`) trabaja con **reservas individuales** (`POST /api/v1/reservations` acepta un solo `eventId` + `tierId`). Cada reserva tiene un TTL independiente de ~10 minutos. El carrito del frontend será una **capa de agregación de presentación**: no existe un recurso "carrito" en el backend. Los pagos se procesan reserva por reserva.

**Capas afectadas:** `frontend/`
**Depende de:** HU-04 (ms-ticketing — reservas), HU-FE-13 (flujo de checkout), HU-AUD-03 (selector de cantidad)
**Stack:** React · TypeScript · CSS Modules · Vite · Axios · React Router · localStorage

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

### HU-CART-01: Agregar items al carrito desde el detalle de evento — SP: 8

Como **Comprador**
Quiero poder agregar entradas de un evento a un carrito de compras sin completar el pago inmediatamente
Para poder seguir navegando por la cartelera y agregar entradas de otros eventos antes de pagar

**Prioridad:** Alta
**Estimación:** 8 SP
**Justificación SP:** Requiere crear una capa completa de estado global (CartContext + cartService), persistirla en localStorage, modificar el flujo actual de EventDetail para ofrecer la opción "Agregar al carrito" además de "Comprar ahora", crear el modelo de datos del CartItem incluyendo datos del evento/tier/reserva, y gestionar el ciclo de vida de las reservas fuera del componente EventDetail.

#### Criterios de Aceptación

**CA-01. Botón "Agregar al carrito" visible junto a "Reservar"**
```gherkin
Escenario: Acción de agregar al carrito disponible
  Dado que el comprador está en la vista de detalle de un evento
  Y ha seleccionado un tier disponible
  Y ha elegido una cantidad de entradas
  Cuando el panel de tickets muestra las acciones disponibles
  Entonces se muestra el botón "Agregar al carrito" además del botón "Reservar"
  Y ambos botones están habilitados si hay cuota disponible en el tier
```

**CA-02. Creación de reserva e ingreso al carrito**
```gherkin
Escenario: Item agregado exitosamente al carrito
  Dado que el comprador ha seleccionado el tier "VIP" con cantidad 2 en el evento "Hamlet"
  Cuando hace click en "Agregar al carrito"
  Entonces se crea una reserva en el backend (POST /api/v1/reservations)
  Y el item se agrega al carrito con: eventId, eventTitle, eventDate, eventRoom, eventImage, tierId, tierType, tierPrice, quantity, reservationId, validUntilAt
  Y se muestra una confirmación visual breve (toast o snackbar) "Agregado al carrito"
  Y el badge del ícono de carrito en el NavBar se incrementa
```

**CA-03. Persistencia del carrito en localStorage**
```gherkin
Escenario: Carrito sobrevive a la navegación
  Dado que el comprador tiene 2 items en el carrito
  Cuando navega a la cartelera, a venues, o recarga la página
  Y luego vuelve al carrito
  Entonces los 2 items siguen presentes en el carrito con toda su información
```

**CA-04. No se puede agregar el mismo evento+tier dos veces**
```gherkin
Escenario: Duplicado de item en carrito
  Dado que el comprador ya tiene en el carrito "Hamlet — VIP x2"
  Cuando intenta agregar "Hamlet — VIP" nuevamente
  Entonces se muestra un mensaje "Ya tienes este tier en tu carrito"
  Y el item existente no se duplica
  Y se ofrece la opción de ir al carrito para modificar la cantidad
```

**CA-05. Múltiples eventos en el carrito**
```gherkin
Escenario: Carrito con items de distintos eventos
  Dado que el comprador agrega "Hamlet — VIP x2" al carrito
  Y luego navega al evento "Romeo y Julieta" y agrega "General x1"
  Cuando abre la vista del carrito
  Entonces ve ambos items con sus datos completos
  Y el total muestra la suma de ambos subtotales
```

**CA-06. Límite razonable de items en el carrito**
```gherkin
Escenario: Máximo de items en el carrito
  Dado que el comprador tiene 5 items en el carrito
  Cuando intenta agregar un sexto item
  Entonces se muestra un mensaje "Máximo 5 reservas simultáneas permitidas"
  Y el item no se agrega
```

#### Subtasks

**DEV Frontend**
- [ ] Crear interfaz `CartItem` en `frontend/src/types/cart.types.ts` con: eventId, eventTitle, eventDate, eventRoom, eventImageUrl, tierId, tierType, tierPrice, quantity, reservationId, validUntilAt, addedAt
- [ ] Crear `cartService.ts` en `frontend/src/services/` con funciones CRUD sobre `localStorage` (key: `sem7_shopping_cart`)
- [ ] Crear `CartContext.tsx` en `frontend/src/contexts/` con: items, addItem, removeItem, updateItem, clearCart, itemCount
- [ ] Envolver la app con `CartProvider` en `main.tsx` o `App.tsx`
- [ ] Agregar botón "Agregar al carrito" en `TicketPanel` o junto al CTA de reserva en EventDetail
- [ ] Al agregar al carrito: llamar `createReservation()` → guardar el item con el `reservationId` → mostrar confirmación
- [ ] Validar duplicados por `eventId + tierId`
- [ ] Implementar límite de 5 items en carrito

**QA**
- [ ] Verificar que el botón "Agregar al carrito" aparece junto a "Reservar"
- [ ] Verificar que se crea la reserva en el backend al agregar
- [ ] Verificar persistencia tras navegación y recarga
- [ ] Verificar que duplicados se rechazan con mensaje claro
- [ ] Verificar que el límite de 5 items se respeta
- [ ] Verificar que items de múltiples eventos coexisten correctamente

---

### HU-CART-02: Vista de carrito de compras — SP: 8

Como **Comprador**
Quiero ver una lista consolidada de todas las entradas que he agregado al carrito con sus tiempos restantes
Para revisar mi selección, eliminar items no deseados y proceder al pago de los que desee

**Prioridad:** Alta
**Estimación:** 8 SP
**Justificación SP:** Requiere una página nueva (`CartPage`) con su ruta `/carrito`, componentes de UI para listar items del carrito (CartItemCard), cálculo de subtotales/total, countdown por cada item basado en `validUntilAt`, acciones de eliminar y proceder a checkout, y manejo de estados (vacío, con items, con items expirados).

#### Criterios de Aceptación

**CA-01. Vista de carrito con todos los items**
```gherkin
Escenario: Carrito con items pendientes
  Dado que el comprador tiene 3 items en el carrito
  Cuando navega a /carrito
  Entonces se muestran 3 tarjetas de item con:
    | Campo          | Ejemplo                           |
    | Imagen evento  | Poster de "Hamlet"                |
    | Título evento  | Hamlet                            |
    | Fecha evento   | 15 de Julio, 2026                 |
    | Venue          | Teatro Nacional                   |
    | Tier           | VIP                               |
    | Cantidad       | 2 entradas                        |
    | Precio unit.   | $50.000                           |
    | Subtotal       | $100.000                          |
    | Tiempo restante| 07:23 (countdown en rojo si < 2min)|
  Y se muestra el resumen total en un panel lateral o inferior
```

**CA-02. Countdown en tiempo real por item**
```gherkin
Escenario: Timer visible por cada item del carrito
  Dado que el comprador ve el carrito con un item cuya reserva expira en 5 minutos
  Cuando pasan 60 segundos
  Entonces el countdown de ese item muestra 04:00
  Y el countdown es independiente para cada item (cada uno tiene su propio validUntilAt)
```

**CA-03. Item expirado marcado visualmente**
```gherkin
Escenario: Reserva expirada dentro del carrito
  Dado que el comprador tiene un item cuya reserva ya expiró (validUntilAt < ahora)
  Cuando visita el carrito
  Entonces el item expirado se muestra con estilo atenuado (opacidad reducida)
  Y se muestra un badge "Expirado" en rojo sobre el item
  Y el botón "Pagar" de ese item está deshabilitado
  Y se ofrece un botón "Renovar reserva" que crea una nueva reserva para el mismo evento+tier
```

**CA-04. Eliminar item del carrito**
```gherkin
Escenario: Eliminación de un item
  Dado que el comprador ve el carrito con 3 items
  Cuando hace click en el botón de eliminar (X) de un item
  Entonces se muestra una confirmación breve "¿Eliminar este item?"
  Y al confirmar, el item se remueve del carrito
  Y el total se recalcula
  Y el badge del NavBar se actualiza
```

**CA-05. Carrito vacío**
```gherkin
Escenario: Sin items en el carrito
  Dado que el comprador no tiene items en el carrito
  Cuando navega a /carrito
  Entonces se muestra un estado vacío con ilustración o ícono
  Y el mensaje "Tu carrito está vacío"
  Y un botón "Explorar cartelera" que redirige a /eventos
```

**CA-06. Proceder al checkout de un item específico**
```gherkin
Escenario: Pago de un item individual desde el carrito
  Dado que el comprador tiene 2 items en el carrito y ambas reservas están activas
  Cuando hace click en "Pagar" en el primer item
  Entonces es redirigido a /eventos/:eventId con el contexto de checkout restaurado
  Y la pantalla se posiciona en el paso de checkout/pago con los datos del item (reservationId, tierId, quantity, email)
  Y al completar el pago, el item se remueve del carrito automáticamente
```

**CA-07. Resumen de precios**
```gherkin
Escenario: Cálculo de totales del carrito
  Dado que el comprador tiene:
    | Item          | Precio  | Cantidad | Subtotal  |
    | Hamlet VIP    | $50.000 | 2        | $100.000  |
    | R&J General   | $30.000 | 1        | $30.000   |
  Cuando ve el panel de resumen
  Entonces el subtotal general muestra $130.000
  Y las tarifas de servicio muestran $10.000 × 2 reservas = $20.000
  Y el total general muestra $150.000
```

#### Subtasks

**DEV Frontend**
- [ ] Crear ruta `/carrito` en `AppRoutes.tsx` apuntando a `CartPage`
- [ ] Crear página `CartPage.tsx` en `frontend/src/pages/CartPage/`
- [ ] Crear componente `CartItemCard.tsx` con: imagen, datos del evento, tier, cantidad, precio, countdown, botones (pagar, eliminar)
- [ ] Crear componente `CartSummary.tsx` con desglose de subtotales, service fee y total
- [ ] Implementar countdown por item usando `validUntilAt` del CartItem
- [ ] Estilizar item expirado: opacidad reducida, badge "Expirado", botón pagar deshabilitado
- [ ] Implementar botón "Renovar reserva" que llama `createReservation()` y actualiza el item con el nuevo `reservationId` y `validUntilAt`
- [ ] Implementar eliminación de item con confirmación
- [ ] Implementar navegación a checkout con estado restaurado al hacer click en "Pagar"
- [ ] Implementar estado vacío con CTA a la cartelera
- [ ] Crear `CartPage.module.css` con diseño consistente con Teatro Noir

**QA**
- [ ] Verificar que todos los campos del item se muestran correctamente
- [ ] Verificar countdown en tiempo real por cada item
- [ ] Verificar que items expirados se marcan visualmente y no permiten pago
- [ ] Verificar eliminación con confirmación y recálculo de totales
- [ ] Verificar estado vacío con CTA funcional
- [ ] Verificar navegación al checkout con datos restaurados
- [ ] Verificar cálculo correcto de subtotales, service fee y total
- [ ] Verificar "Renovar reserva" crea nueva reserva exitosamente

---

### HU-CART-03: Integración del carrito en el NavBar — SP: 3

Como **Comprador**
Quiero ver un ícono de carrito en la barra de navegación con un badge que muestre la cantidad de items pendientes
Para acceder rápidamente a mi carrito desde cualquier vista de la aplicación

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** Requiere reasignar el ícono `ShoppingCart` existente para que apunte a `/carrito` en vez de `/mis-tickets`, agregar un badge dinámico con el conteo de items, y mantener el enlace a "Mis Tickets" accesible desde otra ubicación (menú o link dentro del carrito/perfil).

#### Criterios de Aceptación

**CA-01. Ícono de carrito apunta a /carrito**
```gherkin
Escenario: Navegación desde el ícono de carrito
  Dado que el comprador está en cualquier vista pública
  Cuando hace click en el ícono de carrito del NavBar
  Entonces es redirigido a /carrito
  Y ya no redirige a /mis-tickets
```

**CA-02. Badge con conteo de items**
```gherkin
Escenario: Badge numérico en el ícono de carrito
  Dado que el comprador tiene 3 items en el carrito
  Cuando el NavBar se renderiza
  Entonces el ícono de carrito muestra un badge circular con el número "3"
  Y el badge usa el color de acento del tema (dorado/gold)
```

**CA-03. Badge oculto cuando el carrito está vacío**
```gherkin
Escenario: Sin badge si no hay items
  Dado que el comprador no tiene items en el carrito
  Cuando el NavBar se renderiza
  Entonces el ícono de carrito se muestra sin badge
```

**CA-04. Badge se actualiza en tiempo real**
```gherkin
Escenario: Actualización dinámica del badge
  Dado que el comprador tiene 2 items en el carrito
  Cuando agrega un tercer item desde el detalle de un evento
  Entonces el badge del NavBar cambia de "2" a "3" sin recargar la página
```

**CA-05. Enlace a "Mis Tickets" reubicado**
```gherkin
Escenario: Acceso a Mis Tickets preservado
  Dado que el ícono de carrito ya no apunta a /mis-tickets
  Cuando el comprador desea ver sus tickets comprados
  Entonces existe un enlace "Mis Tickets" accesible desde el menú de navegación o desde la vista del carrito
  Y el enlace redirige a /mis-tickets
```

#### Subtasks

**DEV Frontend**
- [ ] Modificar el link del ícono `ShoppingCart` en `NavBar.tsx` de `/mis-tickets` a `/carrito`
- [ ] Consumir `itemCount` desde `CartContext` en NavBar
- [ ] Renderizar badge circular sobre el ícono cuando `itemCount > 0`
- [ ] Estilizar badge en `NavBar.module.css` (posición absolute, color dorado, fuente bold pequeña)
- [ ] Agregar enlace "Mis Tickets" en el menú mobile o como link secundario en la sección de navegación
- [ ] Verificar que el badge se actualiza reactivamente al modificar el carrito

**QA**
- [ ] Verificar que el ícono de carrito navega a /carrito
- [ ] Verificar que el badge muestra el conteo correcto
- [ ] Verificar que el badge desaparece con carrito vacío
- [ ] Verificar actualización en tiempo real del badge
- [ ] Verificar que "Mis Tickets" sigue siendo accesible

---

### HU-CART-04: Restaurar contexto de checkout desde el carrito — SP: 5

Como **Comprador**
Quiero que al hacer click en "Pagar" en un item del carrito se restaure el flujo de checkout con todos los datos de mi reserva
Para completar el pago sin tener que seleccionar el tier ni ingresar mis datos de nuevo

**Prioridad:** Alta
**Estimación:** 5 SP
**Justificación SP:** Requiere modificar `EventDetail.tsx` para aceptar estado de navegación (`location.state`) con datos del carrito, restaurar las variables `selectedTierId`, `order`, `screen`, `timeLeft` y `retryCount` a partir del CartItem, recalcular el tiempo restante basándose en `validUntilAt`, y remover el item del carrito automáticamente al completar o expirar el pago.

#### Criterios de Aceptación

**CA-01. Navegación con estado restaurado**
```gherkin
Escenario: Click en "Pagar" desde el carrito
  Dado que el comprador tiene un item en el carrito con reservationId válido
  Cuando hace click en "Pagar" en la vista del carrito
  Entonces es redirigido a /eventos/:eventId
  Y la vista se posiciona directamente en la pantalla de checkout
  Y los datos de la reserva (reservationId, tierId, tierType, tierPrice, quantity) están precargados
  Y el countdown muestra el tiempo restante calculado desde validUntilAt
```

**CA-02. Email pre-rellenado si fue guardado**
```gherkin
Escenario: Email persistido en el item del carrito
  Dado que el comprador ingresó su email al agregar el item al carrito
  Cuando restaura el checkout desde el carrito
  Entonces el campo de email muestra el valor previamente ingresado
  Y el comprador puede modificarlo antes de pagar
```

**CA-03. Pago exitoso remueve el item del carrito**
```gherkin
Escenario: Limpieza del carrito tras pago confirmado
  Dado que el comprador restauró un item del carrito y está en la pantalla de pago
  Cuando el pago se procesa con resultado CONFIRMED
  Entonces el item se remueve automáticamente del carrito
  Y el badge del NavBar se decrementa
  Y el ticket se guarda normalmente en localStorage
```

**CA-04. Pago fallido mantiene el item en el carrito**
```gherkin
Escenario: Item preservado tras pago rechazado
  Dado que el comprador restauró un item del carrito y el pago fue rechazado
  Cuando se muestra la pantalla de error con opción de reintento
  Entonces el item permanece en el carrito
  Y el comprador puede reintentar (máximo 3 veces) sin perder el item
```

**CA-05. Reserva expirada durante el checkout restaurado**
```gherkin
Escenario: Timer llega a 0 durante el checkout del carrito
  Dado que el comprador restauró un item del carrito con 2 minutos restantes
  Cuando el timer llega a 0 durante el checkout
  Entonces se muestra la notificación de expiración
  Y el item se marca como expirado en el carrito
  Y se ofrece la opción de volver al carrito
```

**CA-06. Volver al carrito desde el checkout restaurado**
```gherkin
Escenario: Navegación de vuelta al carrito
  Dado que el comprador está en un checkout restaurado desde el carrito
  Cuando hace click en "Volver al carrito" o en el ícono de carrito del NavBar
  Entonces regresa a /carrito
  Y el item mantiene su estado actual (activo o expirado)
```

#### Subtasks

**DEV Frontend**
- [ ] Modificar `EventDetail.tsx` para leer `location.state` con datos del CartItem
- [ ] Si `location.state.fromCart` existe, inicializar: `screen = 'checkout'`, `selectedTierId`, `order` con datos del CartItem
- [ ] Calcular `timeLeft` a partir de `validUntilAt - Date.now()`
- [ ] Al completar pago (CONFIRMED), llamar `removeItem(cartItemId)` del CartContext
- [ ] Al expirar timer, actualizar el item en el carrito como expirado
- [ ] Agregar botón "Volver al carrito" en la UI de checkout cuando `fromCart === true`
- [ ] Pasar `email` del CartItem como valor inicial del campo email en PaymentPanel

**QA**
- [ ] Verificar que el checkout se restaura correctamente con todos los datos
- [ ] Verificar que el countdown se calcula desde validUntilAt
- [ ] Verificar remoción del item tras pago exitoso
- [ ] Verificar que el item se preserva tras pago fallido
- [ ] Verificar comportamiento al expirar la reserva durante checkout restaurado
- [ ] Verificar navegación de vuelta al carrito

---

### HU-CART-05: Alertas de expiración de items del carrito — SP: 3

Como **Comprador**
Quiero recibir alertas cuando un item de mi carrito esté por expirar o haya expirado
Para tomar acción antes de perder la reserva y poder renovarla a tiempo

**Prioridad:** Media
**Estimación:** 3 SP
**Justificación SP:** Requiere un efecto global (dentro del CartContext o un hook dedicado) que monitoree los `validUntilAt` de todos los items, dispare notificaciones locales cuando queden menos de 2 minutos, y marque automáticamente los items expirados.

#### Criterios de Aceptación

**CA-01. Alerta cuando un item está por expirar**
```gherkin
Escenario: Notificación de expiración próxima
  Dado que el comprador tiene un item en el carrito cuya reserva expira en menos de 2 minutos
  Y el comprador NO está en el checkout de ese item
  Cuando el sistema detecta que quedan < 2 minutos
  Entonces se muestra una notificación toast/banner: "Tu reserva para [Evento] — [Tier] expira en menos de 2 minutos"
  Y la notificación incluye un link directo para proceder al pago
```

**CA-02. Marcado automático de items expirados**
```gherkin
Escenario: Item expirado marcado automáticamente
  Dado que el comprador tiene un item en el carrito cuya reserva ha expirado
  Cuando el sistema detecta que validUntilAt < ahora
  Entonces el item se marca como expirado en el estado del carrito
  Y el badge del NavBar refleja solo los items activos (no expirados)
```

**CA-03. Notificación post-expiración**
```gherkin
Escenario: Avisado post expiración
  Dado que un item acaba de expirar en el carrito
  Cuando el sistema lo detecta
  Entonces se muestra una notificación: "Tu reserva para [Evento] — [Tier] ha expirado. Puedes renovarla desde el carrito."
  Y la notificación incluye un link al carrito
```

#### Subtasks

**DEV Frontend**
- [ ] Crear hook `useCartExpirationWatcher` que ejecute un interval (cada 30s) verificando `validUntilAt` de cada item
- [ ] Cuando un item tiene < 2 min restantes y no se ha alertado, disparar notificación local (toast o usar `addNotification` del NotificationsContext)
- [ ] Cuando un item expira, marcarlo como `expired: true` en el CartContext y actualizar localStorage
- [ ] Emitir notificación de expiración consumada
- [ ] Agregar flag `expirationAlerted` al CartItem para no repetir alertas
- [ ] Calcular `itemCount` como items NO expirados para el badge del NavBar

**QA**
- [ ] Verificar que la alerta se muestra cuando faltan < 2 minutos
- [ ] Verificar que la alerta no se repite para el mismo item
- [ ] Verificar marcado automático de items expirados
- [ ] Verificar notificación post-expiración
- [ ] Verificar que el badge cuenta solo items activos
