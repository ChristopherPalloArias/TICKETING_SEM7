# Análisis de Riesgos — SPEC-022
## Sprint 3: Métricas, Salas, Navegación, Hardening

**Generado por:** QA Agent (ASDD) — Skill: risk-identifier
**Spec de referencia:** `.github/specs/sprint3-metricas-salas-navegacion-hardening.spec.md`
**Fecha:** 2026-04-01
**Metodología:** Regla ASD (Alto=Obligatorio, Medio=Recomendado, Bajo=Opcional)

---

## Resumen Ejecutivo

| Nivel | Cantidad | Testing |
|-------|----------|---------|
| **ALTO (A)** | 8 | Obligatorio — bloquea release |
| **MEDIO (S)** | 7 | Recomendado — documentar si se omite |
| **BAJO (D)** | 4 | Opcional — backlog |
| **TOTAL** | **19** | — |

**Veredicto de release:** Requiere cobertura completa de los 8 riesgos ALTO antes de producción.

---

## Matriz de Riesgos — Detalle

| ID | HU | Descripción del Riesgo | Factores ASD | Nivel | Testing |
|----|-----|------------------------|--------------|-------|---------|
| R-001 | HU-TKT-01 | Un comprador accede a tickets de otro usuario mediante manipulación del parámetro `buyerId` | Autorización, datos personales | **A** | Obligatorio |
| R-002 | HU-TKT-03 | Descarga de PDF de ticket ajeno o cancelado por inyección directa de ticketId en la URL | Autorización, operación sensible | **A** | Obligatorio |
| R-003 | HU-TKT-02 | La asociación de tickets anónimos vía RabbitMQ duplica tickets en condiciones de race condition o reintentos | Integración externa, lógica compleja, datos financieros | **A** | Obligatorio |
| R-004 | HU-TKT-02 | El evento `user.registered` se publica con payload incorrecto o incompleto, dejando tickets sin asociar | Integración externa, RabbitMQ | **A** | Obligatorio |
| R-005 | HU-ADM-04 | Admin elimina una sala con eventos activos (DRAFT/PUBLISHED) corrompiendo la integridad referencial | Operación destructiva, datos críticos | **A** | Obligatorio |
| R-006 | HU-SEC-08 | Los headers de seguridad no se aplican en rutas de error (4xx/5xx), dejando vectores de XSS/clickjacking abiertos | Seguridad OWASP, exposición en errores | **A** | Obligatorio |
| R-007 | HU-SEC-08 | Stack traces de Java se filtran en respuestas 500, exponiendo arquitectura interna (nombres de clases, rutas) | Seguridad, exposición de información | **A** | Obligatorio |
| R-008 | HU-USR-01 | Cambio de contraseña sin invalidar la sesión permite sesiones zombie activas tras el cambio | Autenticación, seguridad de sesión | **A** | Obligatorio |
| R-009 | HU-ADM-03 | El endpoint `/admin/stats` no tiene circuit breaker: si ms-ticketing falla, el dashboard colapsa completamente | Disponibilidad, integración cross-service | **S** | Recomendado |
| R-010 | HU-ADM-03 | La búsqueda con parámetro `search` no sanitiza input, vulnerable a inyección SQL o XSS reflejado | Seguridad, input del usuario | **S** | Recomendado |
| R-011 | HU-ADM-04 | Concurrencia: dos admins intentan eliminar la misma sala simultáneamente causando error inconsistente | Lógica de negocio, concurrencia | **S** | Recomendado |
| R-012 | HU-TKT-03 | Generación de PDF con datos enriquecidos: si ms-events no responde, el PDF se genera con información incompleta | Integración cross-service, UX | **S** | Recomendado |
| R-013 | HU-TKT-01 | Enriquecimiento cross-service (ms-ticketing → ms-events) agrega latencia significativa con muchos tickets | Performance, alta frecuencia | **S** | Recomendado |
| R-014 | HU-USR-01 | Nueva contraseña similar a la anterior (ej. solo cambia un carácter) no es detectada como insegura | Lógica de validación, seguridad | **S** | Recomendado |
| R-015 | HU-ADM-05 | Sidebar no se colapsa correctamente en pantallas pequeñas (<768px), afectando usabilidad móvil | UX, alta frecuencia en usuarios admin móvil | **S** | Recomendado |
| R-016 | HU-ADM-05 | Los tabs de detalle de evento no retienen el estado activo al navegar entre secciones | UX, componente nuevo sin historial | **D** | Opcional |
| R-017 | HU-ADM-03 | La paginación no resetea al inicio cuando se aplica un nuevo filtro de búsqueda | UX, edge case de usabilidad | **D** | Opcional |
| R-018 | HU-USR-01 | Campo de email muestra "editable" visualmente aunque esté deshabilitado (UI inconsistencia) | Ajuste estético, bajo impacto | **D** | Opcional |
| R-019 | HU-ADM-04 | El modal de edición de sala no muestra el número de eventos asociados como advertencia | UX informativo, bajo impacto funcional | **D** | Opcional |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Acceso no autorizado a tickets de otro usuario (IDOR)
- **Descripción:** Un comprador autenticado puede manipular el parámetro `buyerId` en `GET /api/v1/tickets?buyerId=X` para obtener tickets de otro usuario.
- **Mitigación:** El backend en ms-ticketing debe validar que `buyerId` coincide con el `userId` extraído del JWT. Solo ADMIN puede consultar cualquier buyerId.
- **Tests obligatorios:**
  - Test de integración: JWT de u-200 intentando `buyerId=u-100` → debe retornar 403.
  - Test unitario: `TicketService.validateOwnership()` con userId distinto al token.
  - Test de seguridad (Postman): colección de autorización cruzada.
- **Bloqueante para release:** ✅ Sí

### R-002: Descarga no autorizada de PDF de ticket ajeno o cancelado
- **Descripción:** Cualquier usuario puede intentar `GET /api/v1/tickets/{ticketId}/pdf` con un ticketId de otro usuario o con ticket CANCELLED.
- **Mitigación:** Verificar propietario en ms-ticketing antes de generar el PDF. Retornar 400 si CANCELLED, 403 si no es propietario ni ADMIN.
- **Tests obligatorios:**
  - Test de integración: u-200 descargando PDF de u-100 → 403.
  - Test unitario: ticket CANCELLED → 400 antes de generar el documento.
  - Test E2E: botón deshabilitado en UI para tickets CANCELLED.
- **Bloqueante para release:** ✅ Sí

### R-003: Race condition en asociación de tickets anónimos (duplicación)
- **Descripción:** Si el evento `user.registered` se procesa más de una vez (reintento de RabbitMQ), la operación `UPDATE ... WHERE user_id IS NULL` podría ejecutarse en paralelo causando inconsistencias.
- **Mitigación:** La operación de asociación debe ser idempotente: `UPDATE tickets SET user_id = :userId WHERE buyer_email = :email AND user_id IS NULL`. Idempotente por diseño, pero validar que el consumer tiene `ack-mode` correcto y no procesa duplicados.
- **Tests obligatorios:**
  - Test de integración: publicar `user.registered` dos veces para el mismo email → solo 1 ejecución con efecto.
  - Test unitario: `TicketAssociationService.associateTickets()` con tickets ya asociados → sin duplicación.
- **Bloqueante para release:** ✅ Sí

### R-004: Evento user.registered con payload incorrecto
- **Descripción:** Si api-gateway omite campos del payload (`userId` o `email` nulos), ms-ticketing puede fallar silenciosamente o asociar tickets a usuario null.
- **Mitigación:** Validar payload antes de publicar en api-gateway. En ms-ticketing, validar payload antes de ejecutar UPDATE y logear error si es inválido.
- **Tests obligatorios:**
  - Test unitario: evento con `userId=null` → ms-ticketing rechaza sin lanzar excepción no controlada.
  - Test de integración: verificar que el evento publicado contiene todos los campos requeridos.
- **Bloqueante para release:** ✅ Sí

### R-005: Eliminación de sala con eventos activos corrupta integridad referencial
- **Descripción:** Si DELETE /rooms/{id} no verifica eventos asociados, una sala con eventos DRAFT o PUBLISHED podría eliminarse, huerfanando esos eventos.
- **Mitigación:** `RoomService.delete()` debe consultar eventos asociados antes de eliminar. Retornar 400 con listado de eventos si hay alguno en estado DRAFT o PUBLISHED.
- **Tests obligatorios:**
  - Test de integración: DELETE de sala con evento PUBLISHED → 400 con listado de eventos.
  - Test de integración: DELETE de sala con evento DRAFT → 400 (mismo comportamiento).
  - Test de integración: DELETE de sala sin eventos → 204.
  - Test unitario: `RoomService.validateDeletion()` con sala con eventos.
- **Bloqueante para release:** ✅ Sí

### R-006: Headers de seguridad ausentes en respuestas de error
- **Descripción:** El filtro `SecurityHeadersFilter` puede no ejecutarse para rutas de error (Spring Boot maneja `/error` diferente), dejando respuestas 4xx/5xx sin headers de seguridad.
- **Mitigación:** Configurar el filtro para que se aplique a TODAS las rutas incluyendo las de error. Usar `FilterRegistrationBean` con `setOrder(Ordered.HIGHEST_PRECEDENCE)`.
- **Tests obligatorios:**
  - Test de integración: respuesta 400 con headers de seguridad presentes.
  - Test de integración: respuesta 401 con `X-Frame-Options=DENY` presente.
  - Test de integración: respuesta 500 con todos los headers presentes.
- **Bloqueante para release:** ✅ Sí

### R-007: Stack traces expuestos en respuestas 500
- **Descripción:** Sin `GlobalExceptionHandler`, Spring Boot retorna el stack trace completo en respuestas 500, exponiendo nombres de clases, rutas de archivo y arquitectura interna.
- **Mitigación:** `GlobalExceptionHandler` con `@ControllerAdvice` en cada microservicio. Retornar siempre `{"message": "Error interno del servidor"}` para excepciones no controladas.
- **Tests obligatorios:**
  - Test de integración: provocar excepción no controlada → body solo contiene mensaje genérico.
  - Test unitario: verificar que ningún handler retorna `Throwable.getStackTrace()` en el response.
- **Bloqueante para release:** ✅ Sí

### R-008: Sesiones zombie tras cambio de contraseña
- **Descripción:** Si el sistema no invalida el JWT actual tras el cambio de contraseña, el usuario puede seguir operando con el token antiguo indefinidamente.
- **Mitigación:** Tras el cambio exitoso, retornar 200 y en el frontend limpiar el token del contexto/localStorage y redirigir a `/login`. En backend, opcionalmente agregar la versión de contraseña al hash del JWT para invalidar tokens anteriores.
- **Tests obligatorios:**
  - Test E2E: tras cambio de contraseña, el token anterior retorna 401 en el próximo request.
  - Test de integración: verificar que el frontend limpia el token y redirige.
- **Bloqueante para release:** ✅ Sí

---

## Plan de Mitigación — Riesgos MEDIO (Recomendados)

### R-009: Falta de fallback en dashboard cuando ms-ticketing falla
- **Mitigación:** Implementar fallback en `useAdminStats` con datos en 0/null. Mostrar indicador "Sin datos disponibles" sin colapsar la página.
- **Tests recomendados:** Test unitario del hook con error simulado → estado de fallback.

### R-010: Input de búsqueda sin sanitización
- **Mitigación:** Validar y sanitizar el parámetro `search` en el controlador. Usar parámetros vinculados JPA (no string concatenation) en la query.
- **Tests recomendados:** Test con `search=<script>alert(1)</script>` → respuesta 200 sin ejecutar el script.

### R-013: Latencia en enriquecimiento cross-service (TKT1)
- **Mitigación:** Considerar cache local en ms-ticketing para datos de eventos frecuentes. SLA objetivo: P95 < 500ms para la lista de tickets.
- **Tests recomendados:** Prueba de performance con k6 con 50 usuarios concurrentes en `/mis-tickets`.

---

## Matriz de Cobertura de Testing Actual vs Requerida

| Componente | Tests existentes | Tests requeridos (A) | Cobertura estimada |
|-----------|-----------------|---------------------|-------------------|
| `useMyTickets` hook | ✅ (frontend `__tests__/`) | Test de autorización cruzada | ~70% |
| `useAdminStats` hook | ✅ (frontend `__tests__/`) | Fallback con ms-ticketing caído | ~60% |
| `useRooms` hook | ✅ (frontend `__tests__/`) | Eliminación con eventos asociados | ~65% |
| `RoomFormModal` | ✅ (frontend `__tests__/`) | Validación de campos vacíos | ~75% |
| PDF download | ❌ No hay tests | Autorización + estado CANCELLED | **0%** → Crítico |
| RabbitMQ `user.registered` | ❌ No hay tests | Idempotencia + payload inválido | **0%** → Crítico |
| SecurityHeadersFilter | ❌ No hay tests | Headers en 4xx/5xx | **0%** → Crítico |
| GlobalExceptionHandler | ❌ No hay tests | Sin stack trace en 500 | **0%** → Crítico |
| PATCH /auth/me/password | ❌ No hay tests | Autenticación + invalidación sesión | **0%** → Crítico |
| DELETE /rooms/{id} | ❌ No hay tests | Integridad referencial | **0%** → Crítico |

**Componentes sin cobertura (6 de 10):** Requieren tests antes del release de producción.
