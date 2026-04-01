# Estrategia de Automatización — SPEC-022
## Sprint 3: Métricas, Salas, Navegación, Hardening

**Generado por:** QA Agent (ASDD) — Skill: automation-flow-proposer
**Spec de referencia:** `.github/specs/sprint3-metricas-salas-navegacion-hardening.spec.md`
**Fecha:** 2026-04-01
**Referencia de lineamientos:** `.github/docs/lineamientos/qa-guidelines.md` (Sección 5 — Lineamientos de Ingeniería de Automatización)

---

## Criterios de Priorización (DoR de Automatización)

Según los lineamientos de Sofka QA CoE, un flujo es automatizable cuando cumple:
- ✅ Verificado manualmente sin bugs críticos pendientes
- ✅ Caso de prueba detallado disponible (Gherkin generado)
- ✅ Datos de prueba identificados (DP-001 a DP-010)
- ✅ Viabilidad técnica comprobada (endpoint estable, ambiente disponible)
- ✅ Aprobación del equipo

Factores de ROI aplicados:
- **Repetitividad**: frecuencia de ejecución esperada (por PR, diaria, semanal)
- **Estabilidad**: madurez del componente (nuevo vs existente)
- **Impacto**: severidad si el test falla en producción
- **Costo manual**: tiempo estimado de ejecución manual

---

## Mapa de Automatización por Capa

### Layer 1 — Tests Unitarios y de Componentes (ya en curso)

**Framework:** Vitest + React Testing Library (frontend) / JUnit 5 + Mockito (backend)
**Ejecución:** en cada PR (CI pipeline)

| Flujo | Componente | Tests existentes | Estado |
|-------|-----------|-----------------|--------|
| Hook `useMyTickets` — carga de tickets reales | `hooks/useMyTickets.ts` | ✅ | Completado |
| Hook `useAdminStats` — métricas del dashboard | `hooks/useAdminStats.ts` | ✅ | Completado |
| Hook `useRooms` — CRUD de salas | `hooks/useRooms.ts` | ✅ | Completado |
| Componente `RoomFormModal` — validación formulario | `components/RoomFormModal.tsx` | ✅ | Completado |
| Componente `StatsCards` — render de métricas | `components/StatsCards.tsx` | ✅ | Completado |
| Página `ProfilePage` — cambio de contraseña | `pages/ProfilePage.tsx` | ✅ | Completado |
| Página `MyTicketsPage` — lista real de tickets | `pages/MyTicketsPage.tsx` | ✅ | Completado |
| PDF download — estado CANCELLED bloqueado | `services/ticketService.ts` | ❌ | **Pendiente** |
| SecurityHeadersFilter — presencia de headers | `api-gateway/SecurityHeadersFilter.java` | ❌ | **Pendiente** |
| GlobalExceptionHandler — sin stack trace | `ms-events/GlobalExceptionHandler.java` | ❌ | **Pendiente** |
| RoomService.validateDeletion() | `ms-events/RoomService.java` | ❌ | **Pendiente** |
| TicketAssociationService — idempotencia | `ms-ticketing/TicketAssociationService.java` | ❌ | **Pendiente** |

---

### Layer 2 — Tests de Integración API (Prioridad ALTA)

**Framework:** Postman (collections + Newman para CI) / Spring Boot Test (MockMvc)
**Ejecución:** diaria en rama `develop`, bloqueante si algún test ALTO falla

#### Colección 1: Autorización y control de acceso (IDOR)
**ROI estimado:** Alto — previene vulnerabilidades críticas, costo manual 45 min/ejecución

| Test ID | Descripción | Escenario Gherkin | Nivel |
|---------|-------------|-------------------|-------|
| API-001 | BUYER accede a tickets de otro usuario → 403 | TKT1-02 | 🔴 CRÍTICO |
| API-002 | BUYER descarga PDF de ticket ajeno → 403 | TKT3-04 | 🔴 CRÍTICO |
| API-003 | BUYER accede a métricas admin → 403 | TKT4-06 | 🔴 CRÍTICO |
| API-004 | BUYER hace DELETE /rooms/{id} → 403 | TKT5-08 | 🔴 CRÍTICO |
| API-005 | Sin JWT → 401 en todos los endpoints protegidos | TKT1-05, TKT3-05 | 🔴 CRÍTICO |

#### Colección 2: CRUD de Salas — Integridad referencial
**ROI estimado:** Alto — riesgo de corrupción de datos, costo manual 30 min/ejecución

| Test ID | Descripción | Escenario Gherkin | Nivel |
|---------|-------------|-------------------|-------|
| API-006 | DELETE sala con evento PUBLISHED → 400 + listado | TKT5-04 | 🔴 CRÍTICO |
| API-007 | DELETE sala con evento DRAFT → 400 | TKT5-07 | 🔴 CRÍTICO |
| API-008 | DELETE sala sin eventos → 204 | TKT5-05 | 🟡 NORMAL |
| API-009 | PUT sala con datos válidos → 200 + datos actualizados | TKT5-03 | 🟡 NORMAL |
| API-010 | POST sala con nombre vacío → 400 + mensaje validación | TKT5-06 | 🟡 NORMAL |

#### Colección 3: Headers de seguridad HTTP
**ROI estimado:** Muy Alto — obligatorio por OWASP, costo manual 60 min/ejecución (7 headers × múltiples endpoints)

| Test ID | Descripción | Escenario Gherkin | Nivel |
|---------|-------------|-------------------|-------|
| API-011 | GET /api/v1/events → 7 headers presentes | SEC8-01 | 🔴 CRÍTICO |
| API-012 | GET con JWT inválido → 401 + 7 headers | SEC8-03 | 🔴 CRÍTICO |
| API-013 | Error simulado 500 → body sin stack trace | SEC8-02 | 🔴 CRÍTICO |
| API-014 | X-Content-Type-Options: nosniff en todas las rutas | SEC8-01 | 🔴 CRÍTICO |
| API-015 | X-Frame-Options: DENY presente en errores 4xx | SEC8-03 | 🔴 CRÍTICO |

#### Colección 4: Cambio de contraseña y sesiones
**ROI estimado:** Alto — seguridad de cuentas, costo manual 20 min/ejecución

| Test ID | Descripción | Escenario Gherkin | Nivel |
|---------|-------------|-------------------|-------|
| API-016 | PATCH /auth/me/password con contraseña actual correcta → 200 | USR1-02 | 🔴 CRÍTICO |
| API-017 | PATCH con contraseña actual incorrecta → 400 | USR1-03 | 🔴 CRÍTICO |
| API-018 | Token anterior invalido tras cambio → 401 | USR1-02 | 🔴 CRÍTICO |
| API-019 | Nueva contraseña < 8 chars → 400 + mensaje | USR1-04 | 🟡 NORMAL |

#### Colección 5: Métricas y búsqueda admin
**ROI estimado:** Medio — alta frecuencia de uso por admins, costo manual 25 min/ejecución

| Test ID | Descripción | Escenario Gherkin | Nivel |
|---------|-------------|-------------------|-------|
| API-020 | GET /admin/stats → 4 campos en JSON | TKT4-01 | 🟡 NORMAL |
| API-021 | GET /admin/events?search=Romeo → solo eventos filtrados | TKT4-04 | 🟡 NORMAL |
| API-022 | GET /admin/events?page=1&size=10 → 10 resultados + total | TKT4-05 | 🟡 NORMAL |
| API-023 | GET /admin/stats con ms-ticketing caído → fallback con 0s | TKT4-03 | 🟡 NORMAL |

---

### Layer 3 — Tests de Integración RabbitMQ (Prioridad ALTA)

**Framework:** Spring Boot Test con TestContainers (RabbitMQ en Docker)
**Ejecución:** en rama `develop` antes del merge a `main`

| Test ID | Descripción | Escenario Gherkin | Nivel |
|---------|-------------|-------------------|-------|
| RMQ-001 | Registro BUYER publica `user.registered` con payload completo | TKT2-01 | 🔴 CRÍTICO |
| RMQ-002 | ms-ticketing consume evento y asocia tickets anónimos | TKT2-01 | 🔴 CRÍTICO |
| RMQ-003 | Asociación idempotente (evento consumido 2 veces sin duplicación) | TKT2-03 | 🔴 CRÍTICO |
| RMQ-004 | Registro ADMIN NO publica `user.registered` | TKT2-05 | 🔴 CRÍTICO |
| RMQ-005 | Evento con payload inválido (userId=null) → no asocia, logea error | TKT2-04 | 🟡 NORMAL |

---

### Layer 4 — Tests E2E con Playwright (Prioridad MEDIA)

**Framework:** Playwright (TypeScript)
**Ejecución:** nightly en rama `develop`, y en release candidate
**Ambiente:** staging/docker-compose local

#### Orden de implementación (por ROI)

**Iteración 1 — Flujos críticos de seguridad (2 semanas)**

| Test ID | Flujo E2E | Escenarios cubiertos | Tiempo estimado |
|---------|-----------|---------------------|----------------|
| E2E-001 | Login como BUYER → /mis-tickets → ver lista real → descargar PDF | TKT1-01, TKT3-01 | 3 días |
| E2E-002 | BUYER no puede acceder a /admin/rooms → redirección | sec-nav | 1 día |
| E2E-003 | BUYER cambia contraseña → cierra sesión → vuelve a login | USR1-02 | 2 días |

**Iteración 2 — CRUD de salas y dashboard admin (2 semanas)**

| Test ID | Flujo E2E | Escenarios cubiertos | Tiempo estimado |
|---------|-----------|---------------------|----------------|
| E2E-004 | Admin: crear sala → editar capacidad → verificar en tabla | TKT5-01, TKT5-02, TKT5-03 | 3 días |
| E2E-005 | Admin: intentar eliminar sala con evento → ver error | TKT5-04 | 2 días |
| E2E-006 | Admin: dashboard carga con 4 tarjetas de métricas + búsqueda | TKT4-01, TKT4-04 | 2 días |

**Iteración 3 — Registro y asociación de tickets (2 semanas)**

| Test ID | Flujo E2E | Escenarios cubiertos | Tiempo estimado |
|---------|-----------|---------------------|----------------|
| E2E-007 | Flujo completo: compra anónima → registro → tickets asociados en /mis-tickets | TKT2-01 | 4 días |
| E2E-008 | Registro sin compras previas → /mis-tickets vacío | TKT2-02 | 1 día |

---

### Layer 5 — Tests de Performance con k6 (Condicional — si SLA definidos)

**Framework:** k6
**Condición de ejecución:** Solo si se definen SLAs contractuales formales

> ⚠️ La spec SPEC-022 no define SLAs contractuales explícitos. Los umbrales siguientes son recomendaciones para establecer línea base.

#### Umbrales de referencia propuestos

| Endpoint | Tipo de prueba | Usuarios concurrentes | P95 objetivo | TPS objetivo |
|----------|---------------|----------------------|-------------|-------------|
| `GET /api/v1/tickets?buyerId=X` | Load | 100 | < 500ms | > 50 TPS |
| `GET /api/v1/events/admin/stats` | Load | 50 | < 800ms | > 20 TPS |
| `GET /api/v1/events/admin?search=X` | Load | 50 | < 600ms | > 30 TPS |
| `GET /api/v1/tickets/{id}/pdf` | Stress | 30 | < 3000ms | > 10 TPS |
| `DELETE /api/v1/rooms/{id}` | Spike | 20 | < 300ms | > 15 TPS |

**Nota:** Ejecutar prueba de soak (>120 min) antes de producción para detectar memory leaks en la generación de PDFs.

---

## Roadmap de Implementación

```
Semana 1-2:  Layer 2 — Colecciones Postman (API-001..API-023) + Newman en CI
Semana 3:    Layer 3 — Tests RabbitMQ con TestContainers (RMQ-001..RMQ-005)
Semana 4:    Layer 1 — Tests unitarios pendientes (PDF, SecurityFilter, RoomService)
Semana 5-6:  Layer 4 — Playwright E2E Iteración 1 (E2E-001..E2E-003)
Semana 7-8:  Layer 4 — Playwright E2E Iteración 2 (E2E-004..E2E-006)
Semana 9-10: Layer 4 — Playwright E2E Iteración 3 (E2E-007..E2E-008)
Semana 11:   Layer 5 — k6 performance baseline (si SLAs aprobados)
```

---

## Estimación de ROI Global

| Layer | Tests a crear | Horas implementación | Tiempo manual/ejecución | ROI (6 meses) |
|-------|--------------|---------------------|------------------------|---------------|
| Unitarios pendientes (L1) | 6 tests | 8h | 15 min → 0 | Alto |
| API Integration Postman (L2) | 23 tests | 16h | 180 min → 5 min | Muy Alto |
| RabbitMQ Integration (L3) | 5 tests | 12h | 45 min → 3 min | Alto |
| E2E Playwright (L4) | 8 flujos | 30h | 120 min → 8 min | Medio |
| Performance k6 (L5) | 5 scripts | 10h | 60 min → 15 min | Medio |
| **TOTAL** | **47** | **76h** | **420 min → 31 min** | **ROI: 389 min/ejecución ahorrados** |

**Frecuencia estimada de ejecución:** 3 veces/semana en CI
**Ahorro mensual estimado:** ~5.200 minutos de testing manual (87 horas)

---

## Configuración de Pipeline CI sugerida

```yaml
# .github/workflows/qa-spec022.yml (referencia)
stages:
  - unit-tests:         # Layer 1 — Vitest + JUnit → cada PR
      trigger: pull_request
      bloqueante: true

  - api-integration:    # Layer 2 — Newman → diario en develop
      trigger: schedule (daily) + pull_request
      bloqueante: true (riesgos ALTO)

  - rabbitmq-tests:     # Layer 3 — TestContainers → merge a develop
      trigger: push develop
      bloqueante: true

  - e2e-suite:          # Layer 4 — Playwright → nightly + release
      trigger: schedule (nightly) + release branch
      bloqueante: false (bloqueante en release)

  - performance:        # Layer 5 — k6 → release candidate
      trigger: manual + release candidate
      bloqueante: false
```
