# Matriz de Riesgos ASD - SPEC-021

Metodologia ASD:
- Alto (A): testing obligatorio, bloquea release
- Medio (S): testing recomendado, justificar si se omite
- Bajo (D): testing opcional, priorizable en backlog

## Resumen
- Total riesgos: 11
- Alto (A): 5
- Medio (S): 4
- Bajo (D): 2

## Detalle

| ID | HU | Riesgo | Factor | Nivel | Testing |
|---|---|---|---|---|---|
| R-021-01 | SEC07 | Manejo incorrecto de 401/403 deja sesiones invalidas activas o expone rutas no autorizadas | Autenticacion/autorizacion | A | Obligatorio |
| R-021-02 | ADM2 | Cancelacion publicada sin consistencia entre ms-events, ms-ticketing y ms-notifications | Integraciones async externas | A | Obligatorio |
| R-021-03 | SEC03/SEC06 | Registro/login buyer con validaciones incompletas (password policy o email unico) | Seguridad + datos personales | A | Obligatorio |
| R-021-04 | ADM1 | Cambios estructurales en PUBLISHED alteran reglas de negocio de evento ya publicado | Regla critica de dominio | A | Obligatorio |
| R-021-05 | SEC03/SEC06 | Regresion del flujo anonimo (checkout sin login) rompe conversion de compra | Flujo de alto uso | A | Obligatorio |
| R-021-06 | ADM2 | Cancelacion no idempotente o con comportamiento ambiguo ante reintentos | Complejidad de negocio | S | Recomendado |
| R-021-07 | SEC06 | Rutas buyer (/mis-tickets) sin validacion de acceso o sin orden esperado | UX funcional + autorizacion | S | Recomendado |
| R-021-08 | ADM1 | UI de edicion no refleja restricciones de campos en PUBLISHED | Coherencia UI vs backend | S | Recomendado |
| R-021-09 | SEC07 | Service files no migrados totalmente a apiClient centralizado | Deuda tecnica + inconsistencias | S | Recomendado |
| R-021-10 | ADM2 | Mensajes de cancelacion/feedback UX poco claros | Impacto operativo bajo | D | Opcional |
| R-021-11 | SEC06 | Etiquetas/rutas de navegacion buyer no consistentes | Impacto visual/menor | D | Opcional |

## Mitigacion obligatoria para riesgos Alto

### R-021-01 - Seguridad de interceptores y sesion
- Mitigacion tecnica:
  - Validar token injection en request interceptor.
  - Validar limpieza completa de sesion ante 401.
  - Validar 403 sin redireccion y con mensaje claro.
- Tests obligatorios:
  - frontend/src/__tests__/apiClient.test.ts
  - smoke manual de navegacion con token expirado

### R-021-02 - Consistencia de cancelacion cross-service
- Mitigacion tecnica:
  - Asegurar publish de event.cancelled en ms-events.
  - Validar consumidor en ms-ticketing para expirar PENDING.
  - Validar consumidor en ms-notifications para ack y no bloqueo de cola.
- Tests obligatorios:
  - ms-events/src/test/java/com/tickets/events/service/EventServiceAdminTest.java
  - ms-ticketing/src/test/java/com/tickets/msticketing/consumer/EventCancelledListenerTest.java
  - ms-notifications/src/test/java/com/tickets/msnotifications/consumer/NotificationConsumerTest.java

### R-021-03 - Registro/login buyer robusto
- Mitigacion tecnica:
  - Garantizar email unico con 409 en duplicados.
  - Mantener politica de password en backend y frontend.
  - Asegurar rol BUYER en token de registro.
- Tests obligatorios:
  - api-gateway/src/test/java/com/tickets/gateway/controller/AuthControllerTest.java
  - api-gateway/src/test/java/com/tickets/gateway/service/AuthServiceTest.java
  - frontend/src/__tests__/BuyerRegisterPage.test.tsx

### R-021-04 - Inmutabilidad de campos estructurales en PUBLISHED
- Mitigacion tecnica:
  - Rechazar cambios estructurales en backend.
  - Reflejar restriccion en UI para reducir error humano.
- Tests obligatorios:
  - ms-events/src/test/java/com/tickets/events/controller/EventControllerMutationTest.java
  - ms-events/src/test/java/com/tickets/events/service/EventServiceAdminTest.java

### R-021-05 - No romper compra anonima
- Mitigacion tecnica:
  - Mantener rutas de compra sin requerimiento de JWT.
  - Verificar que buyerId transitorio siga operativo cuando no hay token.
- Tests obligatorios:
  - Validacion funcional E2E del flujo anonimo (pendiente como gap)

## Decision QA
No avanzar a cierre de release sin resolver o aceptar formalmente (con riesgo explicitado) los riesgos A pendientes.
