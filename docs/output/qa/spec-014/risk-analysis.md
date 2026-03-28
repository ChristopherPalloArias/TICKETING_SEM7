# Matriz de Riesgos — SPEC-014: Login de Administrador y Protección de Rutas (Frontend)

**Feature:** admin-auth-frontend  
**SPEC:** SPEC-014  
**HU:** HU-ADM-01  
**Generado por:** QA Agent / risk-identifier  
**Fecha:** 2026-03-28  
**Regla aplicada:** ASD (Alto=obligatorio, Medio=recomendado, Bajo=opcional)

---

## Resumen

| Total | Alto (A) | Medio (S) | Bajo (D) |
|-------|----------|-----------|----------|
| 10    | 4        | 4         | 2        |

---

## Matriz de Riesgos

| ID    | HU        | Descripción del Riesgo                                                                 | Factores                                    | Nivel | Testing      |
|-------|-----------|----------------------------------------------------------------------------------------|---------------------------------------------|-------|--------------|
| R-001 | HU-ADM-01 | Validación de credenciales bypasseable: valores hardcodeados expuestos o comparación insegura | Autenticación/autorización, código nuevo    | A     | Obligatorio  |
| R-002 | HU-ADM-01 | localStorage manipulado permite acceso no autorizado a rutas /admin/*                  | Autenticación/autorización, datos sensibles | A     | Obligatorio  |
| R-003 | HU-ADM-01 | AdminGuard no intercepta todas las rutas /admin/* dejando contenido expuesto           | Autenticación/autorización                  | A     | Obligatorio  |
| R-004 | HU-ADM-01 | localStorage corrupto o con role != ADMIN no limpiado correctamente al montar          | Autenticación/autorización, edge case       | A     | Obligatorio  |
| R-005 | HU-ADM-01 | AuthProvider interfiere en rutas públicas (/eventos) causando redirecciones inesperadas | Componente con muchas dependencias          | S     | Recomendado  |
| R-006 | HU-ADM-01 | Credenciales de demo en texto plano visibles en bundle producción (deuda técnica MVP)   | Código nuevo sin historial, seguridad       | S     | Recomendado  |
| R-007 | HU-ADM-01 | LoginPage no redirige si ya autenticado al montar, permitiendo re-login innecesario     | Lógica de negocio, UX                       | S     | Recomendado  |
| R-008 | HU-ADM-01 | Race condition: múltiples renders de AuthProvider leen localStorage en paralelo         | Alta frecuencia de uso, estado compartido   | S     | Recomendado  |
| R-009 | HU-ADM-01 | Diseño Teatro Noir no aplicado correctamente (tokens CSS incorrectos o faltantes)       | Ajuste estético de UI                       | D     | Opcional     |
| R-010 | HU-ADM-01 | AdminNavBar visible en rutas no protegidas por error de configuración de rutas          | Interno/administrativo, código nuevo        | D     | Opcional     |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Validación de credenciales bypasseable
- **Descripción:** Las credenciales `admin@sem7.com` / `admin123` están hardcodeadas en el módulo `AuthContext.tsx`. Si la comparación no es exacta (case-sensitive, trim no aplicado) o si las constantes privadas son accesibles desde el exterior, el mecanismo de auth puede ser eludido o manipulado.
- **Mitigación técnica:**
  - Las constantes `DEMO_EMAIL`, `DEMO_PASSWORD` deben ser declaradas con `const` a nivel de módulo (no exportadas).
  - La comparación debe ser estricta (`===`), case-sensitive, sin trim automático.
  - Documentar como deuda técnica para reemplazar con auth real (endpoint + JWT) en iteración posterior.
- **Tests obligatorios:**
  - `[AuthContext]` login con credenciales exactas → retorna true
  - `[AuthContext]` login con email en mayúsculas → retorna false (case-sensitive)
  - `[AuthContext]` login con espacios adicionales → retorna false (sin trim)
  - `[AuthContext]` login con password vacío → retorna false
- **Bloqueante para release:** ✅ Sí

### R-002: localStorage manipulado permite acceso no autorizado
- **Descripción:** Un atacante puede escribir manualmente en `localStorage` el objeto `sem7_admin_session` con cualquier valor, incluyendo `role: "ADMIN"`, para obtener acceso al panel sin credenciales. En MVP con auth simulada este es el vector de ataque más directo.
- **Mitigación técnica:**
  - El `AuthProvider` debe validar que el objeto restaurado desde localStorage contenga exactamente `role === 'ADMIN'` (comparación estricta), `userId` (string no vacío) y `email` (string con formato de email básico).
  - Si cualquier campo falta o tiene tipo inesperado → limpiar y establecer `isAuthenticated=false`.
  - Documentar como deuda técnica: en iteración futura usar firma digital del token o auth server-side.
- **Tests obligatorios:**
  - `[AuthContext]` localStorage con role "USER" → limpia y no autentica
  - `[AuthContext]` localStorage con role "ADMIN" pero sin userId → limpia y no autentica
  - `[AuthContext]` localStorage con role "ADMIN" y campos válidos → restaura sesión
- **Bloqueante para release:** ✅ Sí

### R-003: AdminGuard no intercepta todas las rutas /admin/*
- **Descripción:** Si el árbol de rutas en `App.tsx` no envuelve correctamente todas las subrutas de `/admin` dentro del `AdminGuard`, alguna ruta podría ser accesible sin autenticación. Error típico de mala configuración del `<Route path="/admin" element={<AdminGuard />}>`.
- **Mitigación técnica:**
  - Toda ruta bajo `/admin` (excepto `/admin/login`) debe ser hija del `Route` que usa `AdminGuard` como element.
  - Verificar que no existan rutas `/admin/events`, `/admin/events/new`, etc. definidas fuera del bloque protegido.
  - Agregar test de integración de rutas.
- **Tests obligatorios:**
  - `[AdminGuard]` sin sesión → redirige a /admin/login (ya existe ✅)
  - `[AdminGuard]` con sesión → renderiza Outlet (ya existe ✅)
  - `[App/rutas]` navegación a /admin/events sin sesión → redirige a /admin/login
- **Bloqueante para release:** ✅ Sí

### R-004: localStorage corrupto o manipulado no limpiado al montar
- **Descripción:** Si el JSON en localStorage es inválido O si el campo `role` contiene un valor distinto de `'ADMIN'`, el sistema debe limpiar y no autenticar. Un manejo incompleto puede dejar `isAuthenticated` en estado inconsistente.
- **Mitigación técnica:**
  - Envolver el `JSON.parse` en bloque `try/catch`.
  - Tras parsear, validar `parsed.role === 'ADMIN'`, `typeof parsed.userId === 'string'` y `typeof parsed.email === 'string'`.
  - En cualquier condición de fallo → `localStorage.removeItem('sem7_admin_session')` + `isAuthenticated = false`.
- **Tests obligatorios:**
  - `[AuthContext]` JSON inválido → limpia localStorage (ya existe ✅)
  - `[AuthContext]` role diferente a ADMIN → limpia localStorage (GAP ⚠️ no cubierto)
  - `[AuthContext]` userId ausente → limpia localStorage (GAP ⚠️ no cubierto)
- **Bloqueante para release:** ✅ Sí

---

## Riesgos MEDIO — Detalle

### R-005: AuthProvider interfiere en rutas públicas
- **Descripción:** El `AuthProvider` envuelve toda la app. Si su lógica de inicialización tiene un side effect (ej. redirección) al detectar ausencia de sesión sin distinguir si la ruta actual es pública o admin, las rutas `/eventos` y `/` podrían verse afectadas.
- **Mitigación:** El `AdminGuard` es quien redirige, no el `AuthProvider`. Verificar que `AuthProvider` solo gestione estado y no realice navegaciones directas.
- **Tests recomendados:** Test de integración que renderice `/eventos` con `AuthProvider` sin sesión y verifique que no hay redirección.
- **Bloqueante para release:** ❌ No (pero recomendado antes del merge)

### R-006: Credenciales en texto plano en bundle de producción
- **Descripción:** `DEMO_EMAIL = 'admin@sem7.com'` y `DEMO_PASSWORD = 'admin123'` quedan en el bundle JS compilado y son legibles por cualquier usuario con DevTools. En MVP con auth simulada esto es una deuda técnica aceptada pero debe documentarse.
- **Mitigación:** Añadir comentario de deuda técnica en el código. Planificar reemplazo con auth real en una siguiente iteración.
- **Tests recomendados:** Verificar en análisis estático (linting) que las constantes no sean exportadas.
- **Bloqueante para release:** ❌ No (deuda técnica documentada)

### R-007: LoginPage no redirige si ya autenticado al montar
- **Descripción:** Si el usuario ya está autenticado y navega manualmente a `/admin/login`, debe ser redirigido a `/admin/events`. Si este comportamiento falla, el usuario ve el formulario de login innecesariamente.
- **Mitigación:** Verificar que existe `if (isAuthenticated) return <Navigate to="/admin/events" replace />` al inicio del render de `LoginPage`.
- **Tests recomendados:** Test de LoginPage con `isAuthenticated=true` al montar → redirige a /admin/events (ya existe ✅).
- **Bloqueante para release:** ❌ No

### R-008: Race condition en inicialización de AuthProvider
- **Descripción:** En React StrictMode, los efectos se ejecutan dos veces en desarrollo. Si el `useEffect` de `AuthProvider` lee y luego limpia localStorage en el primer render, el segundo render puede encontrar el storage vacío y desautenticar al usuario.
- **Mitigación:** Usar `useMemo` o inicialización lazy del `useState` para leer localStorage solo una vez en el constructor del estado, no en `useEffect`.
- **Tests recomendados:** Verificar que el test de "restaura sesión válida desde localStorage" pasa en StrictMode.
- **Bloqueante para release:** ❌ No

---

## Riesgos BAJO — Detalle

### R-009: Diseño Teatro Noir no aplicado correctamente
- **Descripción:** Los componentes `LoginPage` y `AdminNavBar` deben usar los tokens CSS definidos en `tokens.module.css`. Si se usan valores hexadecimales hardcodeados en lugar de variables CSS, el design system se rompe.
- **Mitigación:** Code review visual + verificación de que los CSS Modules referencian `var(--color-*)`.
- **Bloqueante para release:** ❌ No

### R-010: AdminNavBar visible fuera de rutas protegidas
- **Descripción:** Si por error de configuración el `AdminNavBar` se renderiza como layout global en lugar de dentro del bloque de rutas admin, aparecería en `/eventos`.
- **Mitigación:** El `AdminNavBar` debe estar dentro del árbol de rutas hijo del `AdminGuard`.
- **Bloqueante para release:** ❌ No

---

## Riesgos NO aplicables (fuera de scope SPEC-014)

| Riesgo potencial                   | Razón de exclusión                                      |
|------------------------------------|---------------------------------------------------------|
| Seguridad del endpoint de auth     | No hay endpoint; auth es simulada (frontend-only)       |
| Manejo de Bearer token / JWT       | No aplica en MVP; se delega a iteración futura          |
| GDPR / cifrado de datos en reposo  | No hay datos personales reales almacenados              |
| Headers X-Role + X-User-Id         | Se validan en HU-ADM-02+ (fuera del scope de esta spec) |
| Performance bajo carga             | Módulo frontend sin SLAs definidos en spec              |
