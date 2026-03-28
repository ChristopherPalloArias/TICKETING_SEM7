# QA Checklist — SPEC-014: Login de Administrador y Protección de Rutas (Frontend)

**Feature:** admin-auth-frontend  
**SPEC:** SPEC-014  
**HU:** HU-ADM-01  
**Generado por:** QA Agent  
**Fecha:** 2026-03-28  

---

## 1. Tests existentes en `frontend/src/__tests__/`

### `AuthContext.test.tsx`
| # | Nombre del test                                              | Tipo |
|---|--------------------------------------------------------------|------|
| 1 | `login con credenciales válidas establece sesión y retorna true` | unitario |
| 2 | `login con credenciales inválidas retorna false y no cambia estado` | unitario |
| 3 | `logout limpia localStorage y resetea isAuthenticated`       | unitario |
| 4 | `restaura sesión válida desde localStorage al montar`        | unitario |
| 5 | `limpia localStorage corrupto al montar`                     | unitario |

### `AdminGuard.test.tsx`
| # | Nombre del test                                              | Tipo |
|---|--------------------------------------------------------------|------|
| 6 | `redirige a /admin/login si no autenticado`                  | unitario |
| 7 | `renderiza Outlet si autenticado`                            | unitario |

### `AdminNavBar.test.tsx`
| # | Nombre del test                                              | Tipo |
|---|--------------------------------------------------------------|------|
| 8 | `muestra email del admin y botón cerrar sesión`              | unitario |
| 9 | `llama logout al hacer clic en cerrar sesión`                | unitario |

### `LoginPage.test.tsx`
| # | Nombre del test                                              | Tipo |
|---|--------------------------------------------------------------|------|
| 10 | `renderiza formulario con inputs email y password`           | unitario |
| 11 | `muestra "Credenciales inválidas" tras login fallido`        | unitario |
| 12 | `redirige a /admin/events tras login exitoso`                | unitario |
| 13 | `redirige a /admin/events si ya autenticado`                 | unitario |

---

## 2. Mapeo Criterios de Aceptación → Tests

### CRITERIO-1.1: Login exitoso con credenciales de demo

> El sistema establece sesión con role=ADMIN, userId y email; persiste en localStorage; redirige a /admin/events.

| Aspecto a cubrir                            | Test que lo cubre | Estado |
|---------------------------------------------|-------------------|--------|
| `login()` retorna true con credenciales demo | Test 1 (`AuthContext`) | ✅ Cubierto |
| Estado: `isAuthenticated=true`, `role='ADMIN'` | Test 1 (`AuthContext`) | ✅ Cubierto |
| Estado: `userId` y `email` correctos        | Test 1 (`AuthContext`) | ✅ Cubierto |
| Persistencia en localStorage key `sem7_admin_session` | Test 1 (`AuthContext`) | ✅ Cubierto |
| Redirección a `/admin/events` tras login    | Test 12 (`LoginPage`) | ✅ Cubierto |

**Cobertura CRITERIO-1.1: ✅ COMPLETA**

---

### CRITERIO-1.2: Sesión persistida al recargar

> AuthContext recupera sesión desde localStorage; admin permanece autenticado; accede a /admin/* sin re-login.

| Aspecto a cubrir                            | Test que lo cubre | Estado |
|---------------------------------------------|-------------------|--------|
| Restauración de sesión válida desde localStorage | Test 4 (`AuthContext`) | ✅ Cubierto |
| `isAuthenticated=true` tras restauración    | Test 4 (`AuthContext`) | ✅ Cubierto |
| Acceso a ruta protegida con sesión restaurada | Test 7 (`AdminGuard`) | ✅ Cubierto |

**Cobertura CRITERIO-1.2: ✅ COMPLETA**

---

### CRITERIO-1.3: Login con credenciales inválidas

> Mensaje "Credenciales inválidas"; sin redirección; sin escritura en localStorage.

| Aspecto a cubrir                            | Test que lo cubre | Estado |
|---------------------------------------------|-------------------|--------|
| `login()` retorna false con creds inválidas | Test 2 (`AuthContext`) | ✅ Cubierto |
| `isAuthenticated` permanece false           | Test 2 (`AuthContext`) | ✅ Cubierto |
| localStorage no modificado tras fallo       | Test 2 (`AuthContext`) | ✅ Cubierto |
| Mensaje "Credenciales inválidas" visible     | Test 11 (`LoginPage`) | ✅ Cubierto |
| Sin redirección al dashboard                | Test 11 (`LoginPage`) | ✅ Cubierto |

**Cobertura CRITERIO-1.3: ✅ COMPLETA**

---

### CRITERIO-1.4: Acceso directo a ruta protegida sin sesión

> AdminGuard redirige a /admin/login cuando no hay sesión.

| Aspecto a cubrir                            | Test que lo cubre | Estado |
|---------------------------------------------|-------------------|--------|
| Redirección a /admin/login si `!isAuthenticated` | Test 6 (`AdminGuard`) | ✅ Cubierto |
| Contenido protegido no renderizado          | Test 6 (`AdminGuard`) | ✅ Cubierto |
| Acceso con sesión activa muestra contenido  | Test 7 (`AdminGuard`) | ✅ Cubierto |

**Cobertura CRITERIO-1.4: ✅ COMPLETA**

---

### CRITERIO-1.5: Cierre de sesión

> Elimina localStorage key; resetea AuthContext; redirige a /admin/login.

| Aspecto a cubrir                            | Test que lo cubre | Estado |
|---------------------------------------------|-------------------|--------|
| `logout()` elimina `sem7_admin_session` de localStorage | Test 3 (`AuthContext`) | ✅ Cubierto |
| Estado reseteado: `isAuthenticated=false`, todos null | Test 3 (`AuthContext`) | ✅ Cubierto |
| Botón "Cerrar Sesión" visible en navbar     | Test 8 (`AdminNavBar`) | ✅ Cubierto |
| Clic en "Cerrar Sesión" invoca `logout()`   | Test 9 (`AdminNavBar`) | ✅ Cubierto |
| Navegación a `/admin/login` tras logout     | Test 9 (`AdminNavBar`) | ✅ Cubierto |

**Cobertura CRITERIO-1.5: ✅ COMPLETA**

---

### CRITERIO-1.6: localStorage corrupto o manipulado

> Limpia el valor; establece isAuthenticated=false; rutas redirigen a /admin/login.

| Aspecto a cubrir                            | Test que lo cubre | Estado |
|---------------------------------------------|-------------------|--------|
| JSON inválido → limpia localStorage         | Test 5 (`AuthContext`) | ✅ Cubierto |
| JSON inválido → `isAuthenticated=false`     | Test 5 (`AuthContext`) | ✅ Cubierto |
| `role !== 'ADMIN'` → limpia y no autentica  | ❌ Sin test          | ⚠️ GAP |
| `userId` ausente → limpia y no autentica    | ❌ Sin test          | ⚠️ GAP |
| `email` ausente → limpia y no autentica     | ❌ Sin test          | ⚠️ GAP |

**Cobertura CRITERIO-1.6: ⚠️ PARCIAL — falta validación de campos individuales**

---

### CRITERIO-1.7: Rutas públicas no afectadas por auth de admin

> /eventos y /eventos/:id funcionan sin redirección aunque no haya sesión de admin.

| Aspecto a cubrir                            | Test que lo cubre | Estado |
|---------------------------------------------|-------------------|--------|
| Sin sesión de admin, /eventos funciona      | ❌ Sin test          | ❌ GAP CRÍTICO |
| Con sesión de admin, /eventos no redirige   | ❌ Sin test          | ❌ GAP FALTANTE |
| AuthProvider no interfiere en rutas públicas | ❌ Sin test          | ❌ GAP FALTANTE |

**Cobertura CRITERIO-1.7: ❌ NO CUBIERTA**

---

## 3. Cobertura de Reglas de Negocio

| Regla | Descripción                                                    | Tests que la verifican         | Estado |
|-------|----------------------------------------------------------------|--------------------------------|--------|
| RN-1  | Credenciales hardcodeadas: email=`admin@sem7.com`, pass=`admin123` | Tests 1, 2, 11, 12             | ✅ Cubierta |
| RN-2  | userId fijo: `550e8400-e29b-41d4-a716-446655440000`            | Test 1 (`AuthContext`)         | ✅ Cubierta |
| RN-3  | Persistencia en localStorage key `sem7_admin_session`          | Tests 1, 2, 3, 4, 5            | ✅ Cubierta |
| RN-4  | Headers `X-Role: ADMIN` y `X-User-Id` (peticiones admin)       | N/A — fuera de scope SPEC-014  | ➡️ Aplaza a HU-ADM-02 |
| RN-5  | Rutas públicas `/eventos` y `/eventos/:id` intactas            | ❌ Sin test                    | ❌ GAP |
| RN-6  | Diseño Teatro Noir (tokens CSS)                                | Sin test (visual, Bajo)        | ⚠️ Opcional |

---

## 4. Resumen de Cobertura

| Criterio    | Cobertura | Detalle |
|-------------|-----------|---------|
| CRITERIO-1.1 | ✅ 100%  | 5 aspectos cubiertos |
| CRITERIO-1.2 | ✅ 100%  | 3 aspectos cubiertos |
| CRITERIO-1.3 | ✅ 100%  | 5 aspectos cubiertos |
| CRITERIO-1.4 | ✅ 100%  | 3 aspectos cubiertos |
| CRITERIO-1.5 | ✅ 100%  | 5 aspectos cubiertos |
| CRITERIO-1.6 | ⚠️ 40%   | JSON corrupto cubierto; role/userId/email inválidos NO cubiertos |
| CRITERIO-1.7 | ❌ 0%    | Sin ningún test |

**Cobertura global:** 5/7 criterios completamente cubiertos, 1 parcial, 1 sin cobertura.

---

## 5. GAPs identificados — Acciones recomendadas

### GAP-001 (ALTO — R-004) — CRITERIO-1.6: Validación de campos individuales en localStorage
**Descripción:** Los tests actuales solo verifican JSON malformado. No hay tests para localStorage con `role !== 'ADMIN'`, ausencia de `userId` o ausencia de `email`.  
**Impacto:** Riesgo de seguridad R-002 (localStorage manipulado con role distinto accede al panel).  
**Acción recomendada:** Agregar en `AuthContext.test.tsx`:
```typescript
it('limpia localStorage con role distinto de ADMIN al montar', ...)
it('limpia localStorage sin campo userId al montar', ...)
it('limpia localStorage sin campo email al montar', ...)
```
**Prioridad:** ALTA — Bloqueante para release

### GAP-002 (ALTO — R-005) — CRITERIO-1.7: Rutas públicas no verificadas
**Descripción:** No existe ningún test que renderice `/eventos` o `/eventos/:id` con `AuthProvider` activo y verifique que no hay redirección.  
**Impacto:** Si `AuthProvider` o `AdminGuard` tienen un bug que afecta rutas públicas, no será detectado antes de producción.  
**Acción recomendada:** Agregar test de integración:
```typescript
// App.test.tsx o integration/public-routes.test.tsx
it('rutas públicas /eventos funcionan sin sesión de admin', ...)
it('rutas públicas /eventos no son afectadas con sesión de admin activa', ...)
```
**Prioridad:** ALTA — Recomendado antes del merge

### GAP-003 (BAJO) — CRITERIO-1.1: Case-sensitivity de credenciales
**Descripción:** No hay test que verifique que `Admin@SEM7.COM` / `Admin123` (variaciones de capitalizacion) son rechazadas.  
**Acción recomendada:** Agregar casos en `AuthContext.test.tsx` para email en mayúsculas y password con diferente capitalización.  
**Prioridad:** MEDIA

### GAP-004 (BAJO) — RN-6: Verificación visual de Design System
**Descripción:** Los tokens CSS del design system (Teatro Noir) no están cubiertos por tests automatizados.  
**Acción recomendada:** Revisión manual o screenshot testing (ej. Storybook + Chromatic) en una iteración futura.  
**Prioridad:** BAJA — No bloqueante

---

## 6. Criterios de Salida QA (Definition of Done — QA)

| Criterio DoD                                              | Estado actual |
|-----------------------------------------------------------|---------------|
| Todos los criterios de aceptación tienen al menos 1 test  | ⚠️ CRITERIO-1.7 sin test |
| Riesgos ALTO tienen tests bloqueantes definidos           | ⚠️ R-004 parcial, R-005 sin test |
| GAPs ALTO documentados y asignados                        | ✅ GAP-001 y GAP-002 documentados |
| Tests pasan en CI (último run disponible)                 | ✅ Última ejecución: exit code 0 |
| Reglas de negocio RN-1 a RN-3 cubiertas                   | ✅ Sí |
| RN-5 (rutas públicas intactas) cubierta                   | ❌ Pendiente |

**Estado QA:** ⚠️ CONDITIONAL PASS — Merge permitido con GAP-001 y GAP-002 como deuda de corto plazo documentada en backlog.
