# Matriz de Riesgos ASD — SPEC-018: Auditoría de Limpieza, Conectividad y Funcionalidad

> **Spec:** `.github/specs/auditoria-limpieza-conectividad.spec.md`
> **Generado por:** QA Agent · risk-identifier
> **Fecha:** 2026-03-30
> **Regla ASD:** Alto = obligatorio | Medio = recomendado | Bajo = opcional

---

## Resumen

| Nivel | Cantidad | Acción |
|-------|----------|--------|
| **Alto (A)** | 3 | Testing OBLIGATORIO — bloquea release |
| **Medio (S)** | 4 | Testing RECOMENDADO — documentar si se omite |
| **Bajo (D)** | 2 | Testing OPCIONAL — priorizar en backlog |
| **Total** | **9** | |

---

## Detalle de Riesgos

| ID | HU | Descripción del Riesgo | Factores | Nivel | Testing |
|----|-----|------------------------|----------|-------|---------|
| R-001 | HU-AUD-01 | Endpoint público expone datos sin autenticación — riesgo de exposición no intencionada del endpoint admin | Autenticación/autorización, seguridad de API | **A** | Obligatorio |
| R-002 | HU-AUD-03 | Cálculo incorrecto de total en checkout por propagación de quantity — impacto financiero directo en la transacción | Manejo de pagos/saldos, lógica de negocio compleja | **A** | Obligatorio |
| R-003 | HU-AUD-04 | Navegación con eventId undefined/null al reintentar pago — comprador pierde acceso al flujo de reintento | Integraciones entre componentes, código nuevo sin historial | **A** | Obligatorio |
| R-004 | HU-AUD-01 | VenuesPage sigue usando fetch() nativo en alguna ruta de código — inconsistencia de cliente HTTP, no pasa por interceptores Axios | Componentes con muchas dependencias | **S** | Recomendado |
| R-005 | HU-AUD-03 | QuantitySelector no respeta el límite de quota del tier — permite reservar más entradas de las disponibles | Lógica de negocio compleja, alta frecuencia de uso | **S** | Recomendado |
| R-006 | HU-AUD-03 | Cantidad no guardada correctamente en localStorage — discrepancia entre ticket comprado y ticket mostrado en "Mis Tickets" | Código nuevo sin historial | **S** | Recomendado |
| R-007 | HU-AUD-04 | Botón "Reintentar pago" aparece en tipos de notificación incorrectos (timer_expired, payment_success) | Código nuevo sin historial, UX incorrecta | **S** | Recomendado |
| R-008 | HU-AUD-05 | Endpoints huérfanos acumulan deuda técnica sin documentar — dificulta mantenimiento futuro | Features internas/administrativas | **D** | Opcional |
| R-009 | HU-AUD-05 | TODO markers sin resolver bloquean la evolución hacia autenticación real | Refactorizaciones pendientes | **D** | Opcional |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Exposición no intencionada del endpoint admin de rooms

- **Descripción:** Al crear un endpoint público `GET /api/v1/rooms/public`, existe el riesgo de que el endpoint admin `GET /api/v1/rooms` pierda su protección de autenticación, o que la ruta pública exponga más datos de los necesarios.
- **Factores:** Autenticación/autorización, seguridad de API, configuración de rutas en API Gateway.
- **Mitigación:**
  - Test unitario backend que verifica que `GET /api/v1/rooms` retorna 403 sin `X-Role: ADMIN` ✅ (existente)
  - Test unitario backend que verifica que `GET /api/v1/rooms/public` retorna 200 sin headers ✅ (existente)
  - Test de integración que valide el enrutamiento correcto del API Gateway
  - Verificar que la ruta pública no expone campos sensibles adicionales
- **Tests obligatorios:**
  - `test_rooms_public_endpoint_returns_200_without_auth` ✅
  - `test_rooms_public_endpoint_returns_room_list` ✅
  - `test_getAllRooms_returns_403_without_admin_role` ✅
  - `test_getAllRooms_returns_403_without_role_header` ✅
- **Bloqueante para release:** ✅ Sí
- **Estado mitigación:** ✅ Cubierto por tests existentes

### R-002: Cálculo incorrecto de total en checkout

- **Descripción:** La propagación de `quantity` desde EventDetail → CheckoutScreen → OrderSummary → PaymentPanel involucra múltiples capas de componentes. Un error en la cadena de propagación resulta en cobro incorrecto al comprador.
- **Factores:** Manejo de pagos/saldos, cálculo dinámico `price × quantity + serviceFee`, múltiples puntos de integración frontend.
- **Mitigación:**
  - Test unitario de OrderSummary que verifica cálculo `quantity × price` ✅ (existente)
  - Test unitario de CheckoutScreen que verifica propagación de quantity ✅ (existente)
  - Test de EventDetail que verifica inicialización de quantity = 1 ✅ (existente)
  - Validar con múltiples combinaciones de tier/quantity en datos de prueba
- **Tests obligatorios:**
  - `OrderSummary displays correct total for given quantity` ✅
  - `CheckoutScreen propagates quantity to OrderSummary and PaymentPanel` ✅
  - `CheckoutScreen displays subtotal calculated from quantity × price` ✅
  - `EventDetail initializes quantity to 1 and passes to checkout` ✅
- **Bloqueante para release:** ✅ Sí
- **Estado mitigación:** ✅ Cubierto por tests existentes

### R-003: Navegación con eventId undefined al reintentar pago

- **Descripción:** Si `BackendNotification.eventId` no se mapea correctamente a `AppNotification.eventId`, el botón "Reintentar pago" navegará a `/eventos/undefined`, entregando una experiencia rota al comprador que intenta reintentar su pago.
- **Factores:** Integraciones entre contexto (NotificationsContext) y componente (NotificationsPanel), mapeo de datos desde backend, código nuevo sin historial de estabilidad.
- **Mitigación:**
  - Test unitario que verifica navegación a URL correcta con eventId ✅ (existente)
  - Test unitario que verifica cierre de panel al hacer click ✅ (existente)
  - Validar comportamiento cuando eventId es undefined o null (gap identificado)
- **Tests obligatorios:**
  - `NotificationsPanel navigates to event detail on retry click` ✅
  - `NotificationsPanel closes panel on retry button click` ✅
  - `NotificationsPanel shows retry button for payment_rejected` ✅
- **Bloqueante para release:** ✅ Sí
- **Estado mitigación:** ⚠️ Parcialmente cubierto — falta test para eventId undefined/null

---

## Plan de Mitigación — Riesgos MEDIO

### R-004: Residuos de fetch() nativo en VenuesPage

- **Mitigación:** Test `venueService.getPublicRooms calls correct endpoint with Axios` verifica uso de Axios ✅. Revisión de código para confirmar eliminación completa de fetch().
- **Tests recomendados:** `venueService.test.ts` — 3 tests ✅
- **Documentar si se omite:** Sí

### R-005: QuantitySelector no respeta límite de quota

- **Mitigación:** Tests que verifican deshabilitación de botón + en max ✅ y botón − en min ✅.
- **Tests recomendados:** `QuantitySelector disables + button at max value` ✅, `EventDetail renders QuantitySelector with min=1 and max=tier.quota` ✅
- **Documentar si se omite:** Sí

### R-006: Cantidad no guardada en localStorage

- **Mitigación:** Verificar que `saveTicket()` incluye quantity en el registro almacenado.
- **Tests recomendados:** Test explícito de localStorage con quantity (gap — ver sección de gaps).
- **Documentar si se omite:** Sí

### R-007: Botón reintento en tipos incorrectos

- **Mitigación:** Tests que verifican ausencia del botón en `timer_expired` ✅ y `payment_success` ✅.
- **Tests recomendados:** `NotificationsPanel hides retry button for timer_expired` ✅, `NotificationsPanel hides retry button for payment_success` ✅
- **Documentar si se omite:** Sí

---

## Riesgos BAJO (Documentar en backlog)

| ID | Descripción | Acción sugerida |
|----|-------------|-----------------|
| R-008 | Endpoints huérfanos sin documentar | Crear ADR con inventario en próximo sprint |
| R-009 | TODO markers sin resolver en reservationService.ts | Planificar resolución al implementar autenticación real |
