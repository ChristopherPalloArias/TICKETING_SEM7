# Estrategia QA — SPEC-020: Sprint 1 Seguridad JWT

**Spec de referencia:** `.github/specs/sprint1-seguridad-jwt-gateway-login.spec.md`
**Generado:** 2026-03-31
**Artefactos relacionados:** `gherkin-scenarios.md` · `risk-analysis.md`

---

## 1. Resumen Ejecutivo

La SPEC-020 implementa los cimientos de seguridad del sistema de ticketing: autenticación JWT, validación en el gateway, y eliminación de credenciales hardcodeadas. Dado que **toda la seguridad del sistema depende de esta spec**, la estrategia QA es de máxima prioridad. Los 8 riesgos clasificados como ALTO en `risk-analysis.md` son bloqueantes para el release.

---

## 2. Tipos de Prueba Requeridos

### 2.1 Pruebas Unitarias (Backend)

**Framework:** JUnit 5 + Mockito
**Cobertura mínima requerida:** 80% de líneas en paquetes `security/` y `service/`

| Componente         | Qué probar                                                                 | Prioridad |
|--------------------|---------------------------------------------------------------------------|-----------|
| `JwtService`       | Generación de token con claims correctos (`sub`, `role`, `exp`, `iat`)    | Alta      |
| `JwtService`       | Validación de token válido → retorna claims                               | Alta      |
| `JwtService`       | Token expirado → lanza excepción                                          | Alta      |
| `JwtService`       | Token con firma inválida → lanza excepción                                | Alta      |
| `AuthService`      | Login exitoso → retorna JWT con role correcto                             | Alta      |
| `AuthService`      | Login con contraseña incorrecta → lanza excepción de credenciales         | Alta      |
| `AuthService`      | Registro de admin → persiste BCrypt hash (cost >= 10)                     | Alta      |
| `RateLimitFilter`  | 5 intentos → permite; 6to intento → retorna 429                          | Alta      |
| `RateLimitFilter`  | Rate limit aplicado por IP, no por usuario                                | Media     |
| `SecurityConfig`   | Endpoints públicos no requieren autenticación                             | Media     |
| `SecurityConfig`   | Endpoints admin requieren role ADMIN                                      | Alta      |

### 2.2 Pruebas de Integración (Backend)

**Framework:** Spring Boot Test + Testcontainers (PostgreSQL)
**Scope:** api-gateway completo con BD real

| Escenario                                                                    | Endpoint                      | Código esperado |
|------------------------------------------------------------------------------|-------------------------------|-----------------|
| Login con credenciales válidas                                               | `POST /api/v1/auth/login`     | 200             |
| Login con contraseña incorrecta                                              | `POST /api/v1/auth/login`     | 401             |
| Login con email inexistente                                                  | `POST /api/v1/auth/login`     | 401             |
| 6to intento de login fallido desde misma IP                                  | `POST /api/v1/auth/login`     | 429             |
| Acceso a endpoint admin con token válido ADMIN                               | `POST /api/v1/events`         | 200/201         |
| Acceso a endpoint admin sin token                                            | `POST /api/v1/events`         | 401             |
| Acceso a endpoint admin con token BUYER                                      | `POST /api/v1/events`         | 403             |
| Acceso a endpoint público sin token                                          | `GET /api/v1/events`          | 200             |
| Header `X-Role: ADMIN` forjado sin token → downstream recibe header limpio   | `GET /api/v1/events`          | 200 sin X-Role  |
| Claims JWT propagados correctamente a headers internos                        | `GET /api/v1/events`          | X-User-Id/Role  |
| Registro de admin con token ADMIN válido                                     | `POST /api/v1/auth/register`  | 201             |
| Registro de admin sin token                                                  | `POST /api/v1/auth/register`  | 401             |
| Registro de admin con token BUYER                                            | `POST /api/v1/auth/register`  | 403             |
| Registro con email duplicado                                                 | `POST /api/v1/auth/register`  | 409             |

### 2.3 Pruebas Unitarias (Frontend)

**Framework:** Vitest + React Testing Library
**Cobertura mínima requerida:** 80% en `authService.ts`, `AuthContext.tsx`, `AdminLogin.tsx`

| Componente / Función      | Qué probar                                                                | Prioridad |
|---------------------------|---------------------------------------------------------------------------|-----------|
| `authService.login()`     | Llamada correcta al endpoint de autenticación con credenciales            | Alta      |
| `authService.login()`     | Maneja respuesta 401 y propaga error                                      | Alta      |
| `authService.login()`     | Maneja respuesta 429 y propaga error                                      | Media     |
| `AuthContext`             | No contiene `DEMO_EMAIL` ni `DEMO_PASSWORD`                               | Alta      |
| `AuthContext`             | Token almacenado en `sessionStorage`, no en `localStorage`                | Alta      |
| `AuthContext`             | `logout()` limpia sessionStorage                                          | Alta      |
| `AdminLogin`              | Login exitoso redirige a `/admin/events`                                  | Alta      |
| `AdminLogin`              | Credenciales incorrectas muestran "Credenciales inválidas"                | Alta      |
| `AdminLogin`              | Campo contraseña se limpia tras error                                     | Media     |
| `AdminGuard`              | Con token válido → renderiza contenido protegido                          | Alta      |
| `AdminGuard`              | Sin token → redirige a `/admin/login`                                     | Alta      |
| Interceptor Axios         | Inyecta `Authorization: Bearer <token>` en cada request                   | Alta      |
| Interceptor Axios         | Respuesta 401 redirige a login y limpia sesión                            | Alta      |
| Refresh token             | Se activa cuando `exp - now < 30min`                                      | Media     |
| Refresh token             | No se activa cuando `exp - now > 30min`                                   | Media     |

### 2.4 Pruebas de Seguridad (SAST + Análisis Estático)

| Check                                                           | Herramienta          | Bloqueante |
|-----------------------------------------------------------------|----------------------|------------|
| No existen strings `admin@sem7.com`, `admin123` en frontend     | Búsqueda grep/SAST   | ✅ Sí      |
| No existe clave privada PEM en el repositorio                   | git-secrets / trufflehog | ✅ Sí  |
| `.env` no versionado en git                                     | `.gitignore` check   | ✅ Sí      |
| BCrypt cost factor >= 10                                        | Análisis código      | ✅ Sí      |
| JWT almacenado en `sessionStorage` y no en `localStorage`       | Análisis código frontend | ✅ Sí  |
| Endpoints públicos no requieren autenticación en SecurityConfig | Análisis config      | ✅ Sí      |
| Swagger habilitado solo en profile `dev`                        | Análisis config      | ✅ Sí      |

---

## 3. Criterios de Aceptación de Cobertura

| Módulo                              | Cobertura Líneas | Cobertura Ramas | Estado      |
|-------------------------------------|-----------------|-----------------|-------------|
| `api-gateway/security/`             | ≥ 80%           | ≥ 75%           | Obligatorio |
| `api-gateway/service/`              | ≥ 80%           | ≥ 75%           | Obligatorio |
| `api-gateway/controller/`           | ≥ 75%           | ≥ 70%           | Obligatorio |
| `frontend/services/authService.ts`  | ≥ 90%           | ≥ 85%           | Obligatorio |
| `frontend/contexts/AuthContext.tsx` | ≥ 80%           | ≥ 75%           | Obligatorio |
| `frontend/components/AdminGuard.tsx`| ≥ 80%           | ≥ 75%           | Obligatorio |

> Los porcentajes son umbrales mínimos. Se debe ejecutar el reporte de cobertura como parte del pipeline CI.

---

## 4. Flujos Críticos a Automatizar

Los siguientes flujos tienen clasificación `@smoke @critico` en los escenarios Gherkin y **deben** automatizarse como parte del smoke test del pipeline:

### FLUJO-01: Login y acceso al panel de administración
```
POST /api/v1/auth/login (credenciales válidas)
→ Recibe JWT 200
→ GET /api/v1/events con Authorization: Bearer <token>
→ Recibe 200 con eventos
```
**Frecuencia:** En cada build del pipeline CI/CD

### FLUJO-02: Rechazo de headers forjados
```
GET /api/v1/events con header X-Role: ADMIN (sin token)
→ El microservicio downstream NO recibe el header X-Role
→ El request se procesa como anónimo
```
**Frecuencia:** En cada build del pipeline CI/CD

### FLUJO-03: Endpoints públicos accesibles sin autenticación
```
GET /api/v1/events (sin Authorization)
→ Recibe 200
GET /api/v1/events/{id} (sin Authorization)
→ Recibe 200 o 404 (nunca 401)
```
**Frecuencia:** En cada build del pipeline CI/CD

### FLUJO-04: Rate limiting bloquea el 6to intento fallido
```
POST /api/v1/auth/login (credenciales inválidas) × 5
→ Recibe 401 cada vez
POST /api/v1/auth/login (6to intento)
→ Recibe 429
```
**Frecuencia:** Nightly / antes de release

### FLUJO-05: Login en frontend — end-to-end (si hay E2E)
```
Navegar a /admin/login
→ Ingresar credenciales válidas
→ Clic en "Iniciar Sesión"
→ Verificar redirección a /admin/events
→ Verificar JWT en sessionStorage (no localStorage)
```
**Frecuencia:** Antes de cada release

---

## 5. Riesgos de Seguridad Específicos (OWASP Top 10)

### A01:2021 — Broken Access Control
**Riesgos:** R-001 (header forjado), R-009 (registro sin auth)
**Verificar:**
- El gateway elimina `X-Role`/`X-User-Id` del cliente antes de propagar.
- `POST /api/v1/auth/register` requiere JWT con role ADMIN.
- Endpoints admin retornan 403 con token BUYER.

### A02:2021 — Cryptographic Failures
**Riesgos:** R-006 (clave RS256 expuesta), R-007 (BCrypt débil)
**Verificar:**
- La clave privada no existe en el repositorio de código.
- BCrypt se instancia con strength >= 10.
- El algoritmo del JWT es `RS256` (asimétrico), no `HS256` (compartido).

### A03:2021 — Injection / XSS
**Riesgo:** R-008 (JWT en localStorage vulnerable a XSS)
**Verificar:**
- JWT no existe en `localStorage` en ningún momento.
- Content Security Policy configurada en el gateway (si aplica).

### A04:2021 — Insecure Design
**Riesgos:** R-004 (rate limiting volátil), R-005 (conflicto de stacks)
**Verificar:**
- El rate limiting basado en memoria funciona correctamente aunque sea volátil.
- La coexistencia MVC/WebFlux no genera comportamientos indeterminados en tests.

### A05:2021 — Security Misconfiguration
**Riesgos:** R-003 (seed débil), R-011 (Swagger en prod), R-012 (puertos expuestos)
**Verificar:**
- Swagger retorna 404 con profile `prod`.
- `docker-compose.prod.yml` no tiene `ports:` en servicios de BD.
- El seed falla si `ADMIN_PASSWORD` no está definida.

### A07:2021 — Identification & Authentication Failures
**Riesgos:** R-002 (expiración no detectada), R-007 (BCrypt débil), R-010 (información leaked en login)
**Verificar:**
- El mensaje de error para email inexistente y contraseña incorrecta son idénticos.
- El frontend detecta tokens expirados y redirige al login.
- El interceptor Axios maneja 401 limpiando la sesión.

---

## 6. Checklist de Aceptación para Release

> Marcar cada ítem antes de aprobar el deploy a producción.

### Backend
- [ ] `JwtService` tiene cobertura de tests >= 80%
- [ ] Test de integración: login exitoso retorna JWT con claims correctos
- [ ] Test de integración: 6to intento → 429
- [ ] Test de integración: header X-Role forjado es eliminado por el gateway
- [ ] Test de integración: endpoint protegido sin token → 401
- [ ] Test de integración: endpoint público sin token → 200
- [ ] Análisis estático: no hay clave privada PEM en el repo
- [ ] Análisis estático: BCrypt configurado con strength >= 10
- [ ] `.env` está en `.gitignore`
- [ ] `docker-compose.prod.yml` sin port bindings de BD
- [ ] Swagger retorna 404 con profile `prod`

### Frontend
- [ ] `authService.ts` tiene cobertura >= 90%
- [ ] Test unitario: token en `sessionStorage`, no en `localStorage`
- [ ] Test unitario: no existe `DEMO_EMAIL` ni `DEMO_PASSWORD` en `AuthContext`
- [ ] Test unitario: campo contraseña limpio tras error de login
- [ ] Test unitario: interceptor 401 → limpia sesión y redirige
- [ ] Análisis estático: no existen credenciales hardcodeadas en el código fuente
- [ ] Build de producción no contiene strings `admin@sem7.com` o `admin123`

### QA Sign-off
- [ ] Todos los escenarios `@smoke @critico` ejecutados y pasando
- [ ] Todos los riesgos ALTO (`R-001` a `R-008`) mitigados y verificados con tests
- [ ] Reporte de cobertura adjunto cumple umbrales definidos en sección 3
- [ ] No hay vulnerabilidades críticas en análisis SAST

---

## 7. Notas y Deuda Técnica Documentada

| Ítem          | Descripción                                                                       | Acción Post-MVP          |
|---------------|-----------------------------------------------------------------------------------|--------------------------|
| R-004         | Rate limiting en memoria se pierde en reinicios del contenedor                    | Migrar contadores a Redis |
| CRITERIO-5.4  | Refresh token implementado opcionalmente — validar si `refreshToken()` se ejecuta | Agregar endpoint `/auth/refresh` |
| docker-compose | `docker-compose.prod.yml` requiere creación manual separada del `docker-compose.yml` | Automatizar con CI/CD profiles |
