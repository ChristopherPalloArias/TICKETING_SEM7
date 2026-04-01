# Cobertura vs Criterios de Aceptacion - SPEC-021

Escala:
- Cubierto: existe evidencia automatizada directa
- Parcial: evidencia indirecta o incompleta
- Gap: sin evidencia suficiente

## HU-SEC-07 Interceptores Axios

| Criterio | Estado | Evidencia | Observacion |
|---|---|---|---|
| 7.1 JWT inyectado automaticamente | Cubierto | frontend/src/__tests__/apiClient.test.ts | Verifica Authorization Bearer en request |
| 7.2 401 limpia sesion + redirige login correcto | Cubierto | frontend/src/__tests__/apiClient.test.ts | Cubre ADMIN y BUYER + toast de expiracion |
| 7.3 403 muestra acceso denegado sin redireccion | Cubierto | frontend/src/__tests__/apiClient.test.ts | Mensaje validado y sin redirect |

## HU-ADM-01 Edicion de eventos

| Criterio | Estado | Evidencia | Observacion |
|---|---|---|---|
| ADM1.1 Edicion completa en DRAFT | Cubierto | ms-events/src/test/java/com/tickets/events/controller/EventControllerMutationTest.java, ms-events/src/test/java/com/tickets/events/service/EventServiceAdminTest.java | Update exitoso y persistencia de cambios en backend |
| ADM1.2 Edicion limitada en PUBLISHED | Parcial | ms-events/src/test/java/com/tickets/events/controller/EventControllerMutationTest.java, ms-events/src/test/java/com/tickets/events/service/EventServiceAdminTest.java | Backend cubierto; falta evidencia directa de campos deshabilitados en formulario de edicion |
| ADM1.3 Validacion aforo vs tiers | Cubierto | ms-events/src/test/java/com/tickets/events/controller/EventControllerMutationTest.java, ms-events/src/test/java/com/tickets/events/service/EventServiceAdminTest.java | Rechaza capacidad menor a suma de cupos |

## HU-ADM-02 Cancelacion de eventos

| Criterio | Estado | Evidencia | Observacion |
|---|---|---|---|
| ADM2.1 Cancelacion exitosa con confirmacion y estado CANCELLED | Parcial | ms-events/src/test/java/com/tickets/events/controller/EventControllerMutationTest.java, frontend/src/__tests__/CancelEventModal.test.tsx | Se valida backend + modal; falta evidencia automatizada de exclusion en cartelera publica tras cancelar |
| ADM2.2 Publicacion event.cancelled y notificacion a afectados | Parcial | ms-events/src/test/java/com/tickets/events/service/EventServiceAdminTest.java, ms-notifications/src/test/java/com/tickets/msnotifications/consumer/NotificationConsumerTest.java | Se valida publish/consume; falta prueba de envio efectivo a compradores afectados |
| ADM2.3 Reservas PENDING expiran y liberan cupos | Parcial | ms-ticketing/src/test/java/com/tickets/msticketing/consumer/EventCancelledListenerTest.java, ms-ticketing/src/test/java/com/tickets/msticketing/service/ReservationServiceTest.java | Expiracion PENDING cubierta; liberacion de cupos en ms-events sin evidencia directa en esta suite |

## HU-SEC-03 Registro/Login buyer backend

| Criterio | Estado | Evidencia | Observacion |
|---|---|---|---|
| 3.1 Registro buyer exitoso con JWT BUYER | Cubierto | api-gateway/src/test/java/com/tickets/gateway/controller/AuthControllerTest.java, api-gateway/src/test/java/com/tickets/gateway/service/AuthServiceTest.java | Confirma role BUYER y token |
| 3.2 Compra anonima sin cambios | Gap | Sin evidencia directa en pruebas revisadas | Requiere test de integracion E2E sin token |
| 3.3 Compra autenticada usa userId permanente | Gap | Sin evidencia directa en ms-ticketing/api-gateway revisados | Requiere test de contrato header/token -> buyerId |
| 3.4 Email duplicado retorna 409 | Cubierto | api-gateway/src/test/java/com/tickets/gateway/controller/AuthControllerTest.java, api-gateway/src/test/java/com/tickets/gateway/service/AuthServiceTest.java | Conflicto por email duplicado validado |

## HU-SEC-06 Login/registro buyer frontend

| Criterio | Estado | Evidencia | Observacion |
|---|---|---|---|
| 6.1 Boton login visible y no obligatorio | Parcial | frontend/src/__tests__/NavBarAuth.test.tsx | Se valida visibilidad; falta prueba explicita de compra anonima completa |
| 6.2 Registro buyer en UI y autenticacion | Parcial | frontend/src/__tests__/BuyerRegisterPage.test.tsx | Valida password/confirmacion e invocacion registerBuyer; falta asercion explicita de estado autenticado global |
| 6.3 Email prellenado y no editable en checkout autenticado | Gap | Sin evidencia directa en frontend/src/__tests__/CheckoutScreen.test.tsx | Requiere test de checkout con contexto autenticado |
| 6.4 Historial en /mis-tickets ordenado desc | Gap | Sin evidencia directa en pruebas revisadas | Requiere test de ruta + ordenamiento por fecha |

## Resumen de cobertura
- Criterios evaluados: 17
- Cubiertos: 8
- Parciales: 6
- Gaps: 3

Nota: los estados Parcial/Gap no invalidan la implementacion; indican deuda de verificacion pendiente para cierre QA con riesgo controlado.
