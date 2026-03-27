# Requerimiento: Flujo de Checkout y Pago — Frontend

## Contexto del feature

Implementación del flujo transaccional completo en el frontend de SEM7: desde la confirmación de reserva hasta el resultado del pago (éxito o fallo). Este flujo se activa al hacer clic en "Reservar" en la vista de detalle de evento y abarca cuatro pantallas: Checkout, Pago Simulado, Confirmación de Compra y Pago Rechazado.

El backend (ms-ticketing, HU-04 / HU-05) expone los endpoints de creación de reserva (`POST /api/v1/reservations`) y resultado de pago. El pago es simulado en el entorno de desarrollo (mock payment).

**Capa afectada:** `frontend/`
**Depende de:** HU-FE-10 + HU-FE-11 (selección de tier y CTA en detalle), HU-04 (ms-ticketing — reserva), HU-05 (ms-ticketing — pago simulado)
**Stack:** React · TypeScript · CSS Modules · Vite · Axios · React Router · Framer Motion · AnimatePresence
**Diseño de referencia:** Teatro Noir — navbar cambia a fondo primary durante flujo transaccional; tipografía uppercase; animaciones de transición entre pantallas

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

### HU-FE-13: Transiciones animadas entre pantallas del flujo — SP: 2

Como **Comprador**
Quiero que las transiciones entre las pantallas del flujo (catálogo, detalle, checkout, pago, resultado) se perciban fluidas y sin saltos
Para tener una experiencia de usuario cohesionada a lo largo de todo el recorrido de compra

**Prioridad:** Media
**Estimación:** 2 SP
**Justificación SP:** Requiere `AnimatePresence` con `mode="wait"` envolviendo toda la app, `motion.div` con keyframes de entrada/salida, y tipado del estado de pantalla activa (`Screen` type). Sin lógica de negocio, pero crítico para la percepción de calidad.

#### Criterios de Aceptación

**CA-01. Salida animada de la pantalla actual al navegar**
```gherkin
Escenario: Transición al navegar entre pantallas
  Dado que el comprador está en cualquier pantalla del flujo
  Cuando navega a otra pantalla (ej. detalle → checkout)
  Entonces la pantalla actual desaparece con animación de fade-out y slide-up (y: 0 → -20, opacity: 1 → 0)
  Y la nueva pantalla aparece con animación de fade-in y slide-down (y: 20 → 0, opacity: 0 → 1)
```

**CA-02. Transiciones con duración y easing personalizados**
```gherkin
Escenario: Curva de animación fluida
  Dado que ocurre cualquier transición entre pantallas
  Cuando la animación se ejecuta
  Entonces la duración total es de aproximadamente 0.4 segundos
  Y la curva de easing es [0.22, 1, 0.36, 1] (ease-out-expo para sensación elástica)
```

**CA-03. AnimatePresence en modo "wait" evita superposición de pantallas**
```gherkin
Escenario: Sin superposición de pantallas durante la transición
  Dado que el comprador navega entre pantallas
  Cuando la transición se ejecuta
  Entonces la pantalla saliente completa su animación de salida antes de que la entrante inicie
  Y en ningún momento se muestran dos pantallas simultáneamente
```

**CA-04. Estado de pantalla tipado**
```gherkin
Escenario: Navegación interna por estado (no por URL en esta iteración)
  Dado que el comprador avanza en el flujo de compra
  Cuando el estado cambia de valor
  Entonces la pantalla visible corresponde al estado activo del tipo Screen
  Y los valores válidos son: 'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'failure'
```

#### Subtasks

**DEV**
- [ ] Definir tipo `Screen = 'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'failure'` en `src/types/`
- [ ] Envolver el contenido principal en `<AnimatePresence mode="wait">` en `App.tsx`
- [ ] Agregar `<motion.div key={screen} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>` como contenedor de cada pantalla
- [ ] Implementar `renderScreen()` con switch sobre el estado `Screen`
- [ ] Implementar navegación hacia atrás: chevron-left en detalle y checkout regresa a la pantalla anterior

**QA**
- [ ] Verificar que la pantalla saliente no se ve mientras entra la nueva
- [ ] Verificar que la animación de entrada/salida dura ~0.4s y se percibe fluida
- [ ] Verificar que el botón "Atrás" en checkout regresa a la pantalla de detalle
- [ ] Verificar que el botón "Volver al Catálogo" en éxito regresa correctamente a catalog
- [ ] Verificar que no hay flash de pantalla blanca durante las transiciones

---

### HU-FE-14: Navbar en modo transaccional con temporizador de reserva — SP: 3

Como **Comprador en el flujo de compra**
Quiero que la barra de navegación refleje visualmente que estoy en un proceso de pago activo y vea el tiempo que me queda para completar la reserva
Para sentir urgencia y saber cuándo expirará mi lugar reservado

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** El navbar adapta su apariencia (fondo, links, acciones) según la pantalla activa. Incluye un countdown de 9:59 minutos visible durante checkout/pago/fallo. Cambio de color implica transición CSS. El timer se gestiona con `useEffect` + `setInterval`.

#### Criterios de Aceptación

**CA-01. Navbar cambia a modo transaccional en checkout, pago y resultado**
```gherkin
Escenario: Navbar en modo transaccional
  Dado que el comprador entra a la pantalla de checkout, pago, éxito o fallo
  Cuando el navbar se renderiza
  Entonces el fondo del navbar cambia a color primary (oscuro) con texto blanco
  Y los links de navegación ("Events", "Venues", "My Tickets") se ocultan
  Y los íconos de Bell, ShoppingCart y avatar se ocultan
  Y la transición de fondo es suave (transition-all duration-500)
```

**CA-02. Temporizador de reserva visible en checkout, pago y fallo**
```gherkin
Escenario: Timer visible durante el flujo transaccional
  Dado que el comprador está en la pantalla de checkout, pago o fallo
  Cuando el navbar se renderiza en modo transaccional
  Entonces se muestra un pill con ícono Timer y el tiempo restante en formato MM:SS (ej. "09:59")
  Y el pill tiene fondo black/20 con backdrop-blur y texto blanco en negrita
  Y el contador decrementa en tiempo real (cada segundo)
```

**CA-03. Timer inicia al entrar al checkout y se comparte entre pantallas transaccionales**
```gherkin
Escenario: Sincronización del timer entre pantallas
  Dado que el comprador entra al checkout con el timer en 09:59
  Cuando avanza a la pantalla de pago o retrocede a checkout
  Entonces el timer continúa desde donde quedó (no reinicia)
  Y si el timer llega a 00:00 la reserva expira
```

**CA-04. Timer no visible en pantalla de éxito**
```gherkin
Escenario: Pantalla de éxito sin timer
  Dado que el comprador completa el pago exitosamente
  Cuando la pantalla de éxito se muestra
  Entonces el navbar en modo transaccional NO muestra el timer
  Y únicamente se muestra el logo en blanco sobre fondo primary
```

**CA-05. Navbar en modo normal en catálogo y detalle**
```gherkin
Escenario: Navbar en modo normal fuera del flujo transaccional
  Dado que el comprador está en la pantalla de catálogo o detalle de evento
  Cuando el navbar se renderiza
  Entonces el fondo es transparente con backdrop-blur (bg-surface/80)
  Y se muestran los links de navegación y los íconos de acción (Bell, ShoppingCart, avatar)
```

#### Subtasks

**DEV**
- [ ] Agregar prop `screen: Screen` y `timeLeft: string` al componente `TopNav`
- [ ] Definir constante `TRANSACTIONAL_SCREENS = ['checkout', 'payment', 'failure', 'success']`
- [ ] Aplicar clase condicional `bg-primary text-white` vs `bg-surface/80 backdrop-blur-md` según modo
- [ ] Renderizar pill del timer condicionalmente (visible en checkout/payment/failure, oculto en success)
- [ ] Implementar `useEffect` con `setInterval` de 1s en `App.tsx` para decrementar `timeLeft`
- [ ] Inicializar timer en 599 (9 min 59 seg) al entrar por primera vez al checkout

**QA**
- [ ] Verificar color del navbar: fondo primary en transaccional, transparente en normal
- [ ] Verificar que los links de nav se ocultan en modo transaccional
- [ ] Verificar que timer empieza en 09:59 y decrementa correctamente
- [ ] Verificar que el timer NO reinicia al navegar entre checkout y payment
- [ ] Verificar que el timer no aparece en la pantalla de éxito
- [ ] Verificar la transición visual del navbar al cambiar de modo

---

### HU-FE-15: Vista de Checkout — Finalizar Reserva — SP: 5

Como **Comprador**
Quiero ver un resumen de mi reserva y confirmar mi correo electrónico antes de ir al pago
Para verificar que los datos de mi pedido son correctos y recibir los tickets en mi correo

**Prioridad:** Alta
**Estimación:** 5 SP
**Justificación SP:** Pantalla con dos columnas: resumen del pedido (tier, evento, asientos) y panel de pago (cálculo de total con service fee, CTA). Requiere formulario de email con validación, integración con estado global del flujo y generación del objeto `Order`. Complejidad media-alta.

#### Criterios de Aceptación

**CA-01. Resumen del pedido con tier, evento y asientos**
```gherkin
Escenario: Detalle del pedido en pantalla de checkout
  Dado que el comprador llega a la pantalla de checkout desde el detalle del evento
  Cuando la vista se renderiza
  Entonces se muestra la cantidad de tickets (2x), el nombre del tier y el título del evento
  Y se muestran la fecha del evento y la hora (ej. "22:00")
  Y se muestran los asientos reservados (ej. "B12, B13") y la ubicación (ej. "Main Stage Loft")
  Y la sección tiene un ícono Ticket (lucide-react) visible en la esquina del bloque
```

**CA-02. Formulario de correo electrónico del comprador**
```gherkin
Escenario: Captura de email para envío de tickets
  Dado que el comprador está en la pantalla de checkout
  Cuando visualiza la sección "Información del Comprador"
  Entonces se muestra un campo de tipo email con label "Correo Electrónico"
  Y el placeholder es "tu@email.com"
  Y debajo del campo se muestra el texto informativo: "Enviaremos tus e-tickets y el código QR de acceso a esta dirección inmediatamente después del pago."
```

**CA-03. Panel de resumen de pago con total calculado**
```gherkin
Escenario: Cálculo del total a pagar
  Dado que el comprador tiene seleccionado un tier con precio P
  Cuando la pantalla de checkout se renderiza
  Entonces el panel lateral muestra el desglose: "2x [nombre del tier] = $P×2" y "Service Fee = $10.00"
  Y el total a pagar se muestra como "$P×2 + $10.00" con tipografía grande (3xl)
  Y el panel es sticky (top-28) en desktop
```

**CA-04. Botón "Continuar al Pago" habilitado solo con email válido**
```gherkin
Escenario: Validación antes de continuar al pago
  Dado que el comprador está en la pantalla de checkout
  Cuando el campo de email está vacío o tiene un formato inválido
  Entonces el botón "Continuar al Pago" no puede completar la acción
  Cuando el comprador ingresa un email válido (contiene @ y dominio)
  Entonces puede hacer clic en "Continuar al Pago" y avanza a la pantalla de pago
```

**CA-05. Creación del objeto Order al avanzar al pago**
```gherkin
Escenario: Generación del pedido en memoria
  Dado que el comprador hace clic en "Continuar al Pago" con email válido
  Cuando la acción se ejecuta
  Entonces se crea un objeto Order con: eventId, tierId, quantity=2, email, total (precio×2 + $10), referencia aleatoria (ej. "#NE-XXXXXX")
  Y el comprador es llevado a la pantalla de pago con el Order disponible
```

**CA-06. Indicadores de seguridad en el panel de pago**
```gherkin
Escenario: Confianza visual en el checkout
  Dado que el comprador visualiza el panel de resumen de pago
  Cuando el panel está completamente renderizado
  Entonces se muestran íconos de CreditCard, ShieldCheck y CheckCircle2 con opacidad baja
  Y bajo los íconos aparece el texto "Pago Seguro Encriptado" en uppercase tracking-widest
```

#### Subtasks

**DEV**
- [ ] Crear página `pages/Checkout/CheckoutScreen.tsx` con layout de 2 columnas (7-col / 5-col en md)
- [ ] Mostrar resumen del pedido: tier, evento, asientos (B12, B13 hardcoded en esta iteración), ubicación
- [ ] Implementar campo de email controlado con `useState` en `App.tsx` y propagado por props
- [ ] Calcular total: `tier.price * 2 + 10` y mostrarlo con desglose visible
- [ ] Deshabilitar o bloquear avance si `email` está vacío o no contiene "@"
- [ ] Generar objeto `Order` con referencia usando `#NE-${Math.floor(100000 + Math.random() * 900000)}`
- [ ] Implementar botón "Volver" (ChevronLeft) que regresa a la pantalla de detalle

**QA**
- [ ] Verificar que el tier seleccionado en detalle aparece correctamente en el resumen del checkout
- [ ] Verificar cálculo del total: precio×2 + $10 de service fee
- [ ] Verificar que el botón "Continuar al Pago" requiere email
- [ ] Verificar que el panel de pago es sticky en desktop al hacer scroll
- [ ] Verificar que el panel ocupa ancho completo en mobile (no sticky)
- [ ] Verificar que los íconos de seguridad se muestran con opacidad reducida (no dominan visualmente)
- [ ] Verificar que el botón "Volver" regresa a la pantalla de detalle sin perder el tier seleccionado

---

### HU-FE-16: Vista de Pago Simulado (mock payment) — SP: 3

Como **Comprador**
Quiero ver la pantalla de confirmación de pago donde puedo simular un pago exitoso o uno rechazado
Para validar ambos flujos del proceso de compra en el entorno de desarrollo

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** Pantalla de simulación de pago (mock) requerida por HU-05 (ms-ticketing). Muestra el total del pedido con dos opciones de simulación: éxito y fallo. Incluye referencia del pedido y miniatura del evento. Complejidad media por diseño de los dos paneles de acción y el resumen del pedido.

#### Criterios de Aceptación

**CA-01. El total del pedido se muestra de forma prominente**
```gherkin
Escenario: Visualización del monto a pagar
  Dado que el comprador llega a la pantalla de pago simulado
  Cuando la vista se renderiza
  Entonces se muestra el total del pedido en tipografía muy grande (4rem o superior) en el centro superior
  Y debajo se muestra el texto descriptivo "Total de la reserva por 2 entradas [tier]"
```

**CA-02. Dos opciones de simulación: Pago Exitoso y Pago Rechazado**
```gherkin
Escenario: Botones de simulación de pago
  Dado que el comprador está en la pantalla de pago simulado
  Cuando la vista se renderiza
  Entonces se muestran dos tarjetas/botones en grid (1 col mobile / 2 col desktop):
    - "Simular Pago Exitoso" con ícono CheckCircle2 de color primary
    - "Simular Pago Rechazado" con ícono XCircle de color error
  Y cada opción tiene una descripción breve de lo que simula
  Y al pasar el cursor, el ícono escala y el borde se hace más visible
```

**CA-03. Clic en "Simular Pago Exitoso" lleva a la pantalla de confirmación**
```gherkin
Escenario: Resultado de pago exitoso
  Dado que el comprador hace clic en "Simular Pago Exitoso"
  Cuando la acción se ejecuta
  Entonces el flujo avanza a la pantalla de Success (¡Pago aprobado!)
  Y el timer se detiene (ya no es necesario)
```

**CA-04. Clic en "Simular Pago Rechazado" lleva a la pantalla de fallo**
```gherkin
Escenario: Resultado de pago rechazado
  Dado que el comprador hace clic en "Simular Pago Rechazado"
  Cuando la acción se ejecuta
  Entonces el flujo avanza a la pantalla de Failure (Pago declinado)
  Y el timer continúa contando (la reserva sigue activa)
```

**CA-05. Resumen del pedido visible en la pantalla de pago**
```gherkin
Escenario: Referencia y miniatura del evento en pago
  Dado que el comprador está en la pantalla de pago
  Cuando visualiza el resumen inferior
  Entonces se muestra la referencia del pedido (ej. "#NE-123456")
  Y se muestra la miniatura del evento en escala de grises con opacidad reducida
  Y se muestra el nombre del evento y el tipo de acceso (ej. "Acceso VIP - Sector B")
```

#### Subtasks

**DEV**
- [ ] Crear página `pages/Payment/PaymentScreen.tsx` con layout centrado (max-w-2xl)
- [ ] Mostrar `order.total` en tipografía destacada
- [ ] Implementar dos `<button>` en grid 2-col con íconos CheckCircle2 y XCircle
- [ ] Aplicar efecto hover en ícono (group-hover:scale-110) y borde (border-primary/30 → border-primary)
- [ ] Conectar los botones a `onSuccess()` y `onFailure()` callbacks del padre
- [ ] Mostrar referencia del pedido y miniatura del evento con `grayscale opacity-60` bajo los botones

**QA**
- [ ] Verificar que el total mostrado coincide exactamente con el calculado en checkout
- [ ] Verificar que clic en "Exitoso" lleva a success y clic en "Rechazado" lleva a failure
- [ ] Verificar que la miniatura del evento es grayscale con opacidad reducida
- [ ] Verificar que la referencia del pedido sigue el formato "#NE-XXXXXX"
- [ ] Verificar que el grid de 2 botones colapsa a 1 columna en mobile
- [ ] Verificar efectos hover: ícono escala y borde se ilumina en cada opción

---

### HU-FE-17: Vista de Confirmación de Compra Exitosa con Ticket Digital — SP: 5

Como **Comprador**
Quiero ver una pantalla de confirmación con mi ticket digital completo después de un pago exitoso
Para tener acceso inmediato al comprobante de mi reserva, mis asientos y el código QR de entrada

**Prioridad:** Alta
**Estimación:** 5 SP
**Justificación SP:** Pantalla de mayor density visual. Incluye: mensaje de confirmación, ticket digital estilizado con imagen del evento + datos + QR code placeholder + perforación decorativa, y acciones de descarga y retorno al catálogo. Alta complejidad visual y de composición de componentes.

#### Criterios de Aceptación

**CA-01. Mensaje de confirmación con ícono visual prominente**
```gherkin
Escenario: Encabezado de pago aprobado
  Dado que el pago fue simulado como exitoso
  Cuando la pantalla de confirmación se renderiza
  Entonces se muestra un ícono CheckCircle2 en un círculo con fondo primary/10
  Y el texto "¡Pago aprobado!" aparece en tipografía grande (4xl o superior)
  Y el subtítulo es "Tu lugar está asegurado para una noche inolvidable."
```

**CA-02. Ticket digital con datos del evento y asientos**
```gherkin
Escenario: Componente de ticket digital
  Dado que la pantalla de confirmación está visible
  Cuando el comprador visualiza el ticket
  Entonces el ticket muestra:
    - Imagen del evento en escala de grises (parte superior del ticket)
    - Gradiente que cubre la imagen hacia el fondo del card
    - Badge "Confirmado" y título del evento en mayúsculas sobre la imagen
    - Fecha y hora del evento
    - Nombre del venue y sala
    - Ubicación del asiento (ej. "VIP - Platea Central")
    - Número de asientos (ej. "B12, B13")
```

**CA-03. Separador decorativo tipo perforación entre imagen y QR**
```gherkin
Escenario: Efecto visual de ticket físico
  Dado que el ticket digital está visible
  Cuando el comprador observa la separación entre el cuerpo del ticket y la sección del QR
  Entonces se ve una línea punteada horizontal
  Y a cada lado de la línea hay un círculo recortado que simula las muescas de un ticket físico
```

**CA-04. Código QR y número de ticket**
```gherkin
Escenario: Sección de acceso con QR
  Dado que el ticket digital está visible
  Cuando el comprador visualiza la parte inferior del ticket
  Entonces se muestra un placeholder de código QR sobre fondo blanco
  Y debajo del QR aparece el ID de ticket en fuente monospace (ej. "#NE-123456-X9")
  Y el ID tiene label "ID de Ticket" en uppercase tracking-widest sobre él
```

**CA-05. Botón "Descargar Ticket" y "Volver al Catálogo"**
```gherkin
Escenario: Acciones disponibles post-compra
  Dado que la pantalla de confirmación está visible
  Cuando el comprador visualiza los botones de acción
  Entonces se muestra un botón "Descargar Ticket" con ícono Download y estilo primary-gradient
  Y se muestra un botón "Volver al Catálogo" con estilo secundario
  Y haciendo clic en "Volver al Catálogo" el comprador regresa a la pantalla del catálogo
```

#### Subtasks

**DEV**
- [ ] Crear página `pages/Success/SuccessScreen.tsx`
- [ ] Implementar componente de ticket digital con imagen, gradiente, badge, datos, separador y QR
- [ ] Agregar círculos decorativos de perforación usando divs negativos (`-left-4`, `-right-4`) y línea `border-dashed`
- [ ] Renderizar QR como placeholder `[QR CODE]` en contenedor con fondo blanco (integración real pendiente)
- [ ] Generar ID de ticket: `${order.reference}-X9`
- [ ] Implementar botón "Descargar Ticket" (funcionalidad de descarga real pendiente, visual completo)
- [ ] Conectar "Volver al Catálogo" con `onBackToCatalog()` callback

**QA**
- [ ] Verificar que el ícono CheckCircle2 es visible con el círculo de fondo primary/10
- [ ] Verificar que la imagen del evento en el ticket es grayscale con opacidad reducida
- [ ] Verificar que los datos del ticket (fecha, venue, asientos) son legibles
- [ ] Verificar la línea punteada y los círculos decorativos de perforación
- [ ] Verificar que el QR placeholder se muestra sobre fondo blanco
- [ ] Verificar que el ID de ticket sigue el formato "${referencia}-X9"
- [ ] Verificar que "Volver al Catálogo" regresa a la pantalla del catálogo limpiamente

---

### HU-FE-18: Vista de Pago Rechazado — Recuperación y Reintento — SP: 3

Como **Comprador cuyo pago fue rechazado**
Quiero ver un mensaje claro de por qué falló el pago, cuánto tiempo queda para reintentar y las opciones disponibles
Para recuperar mi lugar reservado sin tener que empezar el proceso desde cero

**Prioridad:** Alta
**Estimación:** 3 SP
**Justificación SP:** Pantalla crítica para la retención del comprador en el funnel. Incluye: banner de error con acento primary, detalle del pedido y método de pago, timer con tiempo restante, botón de reintento con contador de intentos (ej. "Intento 2 de 3") y opción de cambio de método. Complejidad media.

#### Criterios de Aceptación

**CA-01. Banner de error con tiempo restante**
```gherkin
Escenario: Notificación de pago rechazado
  Dado que el pago simulado fue rechazado
  Cuando la pantalla de fallo se renderiza
  Entonces se muestra un banner con ícono XCircle de color primary y fondo error/10
  Y el título es "Pago declinado." en tipografía negrita
  Y el mensaje informa: "Tu reserva sigue activa por [MM:SS] minutos. No pierdas tu lugar en el evento."
  Y el tiempo restante aparece en color primary dentro del mensaje
  Y el banner tiene una barra vertical izquierda de color primary
```

**CA-02. Resumen del pedido fallido**
```gherkin
Escenario: Detalles del pedido visible en la pantalla de fallo
  Dado que el comprador está en la pantalla de pago rechazado
  Cuando visualiza la sección de detalles
  Entonces se muestra el nombre del evento con la sección y asientos (ej. "Sección VIP A · Fila 4, Asiento 12")
  Y se muestra el total del pedido en tipografía bold
  Y se muestra el método de pago con ícono CreditCard y últimos 4 dígitos (ej. "Visa **** 8821")
```

**CA-03. Botón de reintento con contador de intentos**
```gherkin
Escenario: Botón de reintento de pago
  Dado que el comprador tiene intentos restantes
  Cuando visualiza la pantalla de fallo
  Entonces el botón principal muestra "Reintentar Pago (Intento 2 de 3)" con ícono RefreshCcw
  Y el botón tiene estilo primary-gradient con sombra
  Y al hacer clic regresa a la pantalla de pago simulado
```

**CA-04. Opción de cambiar método de pago**
```gherkin
Escenario: Cambio de método de pago
  Dado que el comprador prefiere usar otro método de pago
  Cuando hace clic en "Usar otro método de pago"
  Entonces el flujo regresa a la pantalla de checkout (para ingresar nuevamente los datos)
  Y los datos del evento y tier seleccionado se preservan
```

**CA-05. Mensaje de orientación al comprador**
```gherkin
Escenario: Sugerencia para resolver el fallo
  Dado que el comprador está en la pantalla de fallo
  Cuando visualiza el área inferior
  Entonces se muestra el texto: "Por favor, verifica los datos de tu tarjeta o intenta con otro método de pago."
  Y el texto tiene estilo italics, discreto (color on-surface-variant)
```

#### Subtasks

**DEV**
- [ ] Crear página `pages/Failure/FailureScreen.tsx`
- [ ] Implementar banner de error con borde izquierdo primary y mensaje con tiempo restante interpolado
- [ ] Renderizar resumen del pedido: evento, total, método con últimos 4 dígitos (hardcoded "Visa **** 8821" en esta iteración)
- [ ] Implementar botón "Reintentar Pago (Intento 2 de 3)" con ícono RefreshCcw conectado a `onRetry()`
- [ ] Implementar botón "Usar otro método de pago" conectado a `onOtherMethod()` que regresa a checkout
- [ ] Mostrar texto de sugerencia con estilo italics bajo los botones

**QA**
- [ ] Verificar que el tiempo restante en el banner es el mismo que muestra el navbar (sincronizados)
- [ ] Verificar que el banner tiene el borde vertical izquierdo de color primary
- [ ] Verificar que el botón de reintento regresa a la pantalla de pago
- [ ] Verificar que "Usar otro método" regresa a checkout con el tier y evento preservados
- [ ] Verificar que el layout es de 1 columna full-width en mobile y centrado en max-w-lg
- [ ] Verificar que no es posible hacer clic en reintento si el timer llegó a 00:00
