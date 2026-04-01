# Estrategia QA - SPEC-021

## 1. Objetivo
Validar de forma basada en riesgo la feature de Sprint 2 sobre:
- HU-ADM-01: edicion de eventos
- HU-ADM-02: cancelacion de eventos
- HU-SEC-03: registro/login opcional de compradores (backend)
- HU-SEC-06: login/registro opcional de compradores (frontend)
- HU-SEC-07: interceptores Axios centralizados y manejo de errores 401/403

El foco es proteger seguridad, integridad de negocio y consistencia entre microservicios.

## 2. Alcance QA
En alcance:
- Contratos backend de eventos: PUT update y PATCH cancel
- Registro buyer, auth/me y manejo de duplicados
- Publicacion y consumo de event.cancelled entre ms-events, ms-ticketing y ms-notifications
- Comportamiento frontend en rutas nuevas, auth buyer y interceptores
- Evidencia de tests automatizados ya ejecutados en verde (backend y frontend)

Fuera de alcance de esta fase:
- Performance (la spec no define SLAs ni umbrales p95/tps)
- Pruebas de carga/estres/soak

## 3. Enfoque de prueba
### 3.1 Niveles
- Unitarias backend (servicios y consumers)
- Unitarias/controller backend (MockMvc/WebTestClient)
- Unitarias frontend (Vitest + RTL)
- Trazabilidad criterio de aceptacion vs evidencia de tests

### 3.2 Priorizacion por riesgo
- Alto: seguridad (401/403, roles), cancelacion de eventos, integracion async cross-service
- Medio: consistencia UX de rutas buyer y flujos edit/cancel
- Bajo: detalles visuales no funcionales

### 3.3 Criterios de entrada
- Implementacion de SPEC-021 integrada
- Suite backend/frontend relevante en verde
- Ambientes locales de servicios disponibles para validacion funcional

### 3.4 Criterios de salida
- Escenarios Gherkin criticos definidos (ADM1, ADM2, SEC03, SEC06, SEC07)
- Matriz de riesgos ASD con mitigaciones
- Mapa cobertura vs criterios de aceptacion
- Lista explicita de gaps pendientes y pruebas recomendadas

## 4. Evidencia de cobertura revisada
Backend y mensajeria:
- ms-events/src/test/java/com/tickets/events/controller/EventControllerMutationTest.java
- ms-events/src/test/java/com/tickets/events/service/EventServiceAdminTest.java
- api-gateway/src/test/java/com/tickets/gateway/controller/AuthControllerTest.java
- api-gateway/src/test/java/com/tickets/gateway/service/AuthServiceTest.java
- api-gateway/src/test/java/com/tickets/gateway/security/JwtAuthenticationFilterTest.java
- ms-ticketing/src/test/java/com/tickets/msticketing/consumer/EventCancelledListenerTest.java
- ms-ticketing/src/test/java/com/tickets/msticketing/service/ReservationServiceTest.java
- ms-notifications/src/test/java/com/tickets/msnotifications/consumer/NotificationConsumerTest.java

Frontend:
- frontend/src/__tests__/apiClient.test.ts
- frontend/src/__tests__/adminEventService.test.ts
- frontend/src/__tests__/CancelEventModal.test.tsx
- frontend/src/__tests__/BuyerRegisterPage.test.tsx
- frontend/src/__tests__/BuyerLoginPage.test.tsx
- frontend/src/__tests__/NavBarAuth.test.tsx
- frontend/src/__tests__/AppRoutes.test.tsx
- frontend/src/__tests__/EventDetailAdmin.test.tsx

## 5. Estrategia de ejecucion recomendada
1. Smoke critico
- Interceptor 401/403
- Cancelacion de evento publicado
- Registro buyer y auth/me

2. Regresion focalizada
- Edicion de evento draft vs published
- Expiracion de reservas por event.cancelled
- Integridad de rutas buyer/admin

3. Verificacion de integracion
- Publicacion de event.cancelled desde ms-events
- Consumo en ms-ticketing y ms-notifications

## 6. Definicion de severidad para hallazgos
- Alta: rompe seguridad, altera stock/reservas, o genera inconsistencia entre servicios
- Media: rompe una HU principal sin comprometer seguridad sistemica
- Baja: afecta UX o mensajes sin impacto funcional mayor
