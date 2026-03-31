# Matriz de Riesgos — SPEC-020: Sprint 1 Seguridad JWT

**Spec de referencia:** `.github/specs/sprint1-seguridad-jwt-gateway-login.spec.md`
**Generado:** 2026-03-31
**Metodología:** Regla ASD (Alto=Obligatorio / Medio=Recomendado / Bajo=Opcional)

---

## Resumen Ejecutivo

| Total | Alto (A) — Bloquea release | Medio (S) — Recomendado | Bajo (D) — Opcional |
|-------|---------------------------|------------------------|---------------------|
| 14    | 8                         | 4                      | 2                   |

> **Decisión de release**: los 8 riesgos ALTO deben estar mitigados y verificados antes de cualquier despliegue en producción.

---

## Detalle de Riesgos

| ID    | HU        | Descripción del Riesgo                                                                 | Factores de Riesgo                                      | Nivel | Testing       |
|-------|-----------|----------------------------------------------------------------------------------------|---------------------------------------------------------|-------|---------------|
| R-001 | HU-SEC-02 | Inyección / forjado de headers `X-Role` y `X-User-Id` por clientes maliciosos         | Autenticación/autorización, operación destructiva       | **A** | Obligatorio   |
| R-002 | HU-SEC-05 | Tokens expirados no detectados en el frontend — sesión permanece activa               | Autenticación/autorización, funcionalidad alta frecuencia | **A** | Obligatorio   |
| R-003 | HU-SEC-04 | Contraseña del admin seed débil o expuesta en variables de entorno sin cifrar         | Datos sensibles, autenticación                          | **A** | Obligatorio   |
| R-004 | HU-SEC-01 | Rate limiting en memoria (ConcurrentHashMap) — se pierde en cada reinicio del proceso | Dependencia de estado en memoria, SLA implícito          | **A** | Obligatorio   |
| R-005 | HU-SEC-01 | Coexistencia de Spring MVC y Spring WebFlux en el mismo proceso del api-gateway       | Complejidad técnica, código nuevo sin historial          | **A** | Obligatorio   |
| R-006 | HU-SEC-01 | Token JWT firmado con RS256 — clave privada expuesta o insuficientemente protegida    | Datos sensibles, autenticación, impacto sistémico       | **A** | Obligatorio   |
| R-007 | HU-SEC-01 | BCrypt con cost factor insuficiente (< 10) — hashes crackeables en tiempo razonable  | Autenticación, datos personales                         | **A** | Obligatorio   |
| R-008 | HU-SEC-05 | JWT almacenado en `localStorage` (XSS vulnerable) en lugar de memoria/sessionStorage | Autenticación, datos sensibles (OWASP A3:XSS)           | **A** | Obligatorio   |
| R-009 | HU-SEC-02 | Endpoint de registro de admin (`POST /auth/register`) accesible sin autenticación     | Autenticación/autorización, lógica compleja             | **S** | Recomendado   |
| R-010 | HU-SEC-01 | Mensaje de error en login diferenciado entre email inexistente y contraseña incorrecta | Lógica de negocio, fuga de información (OWASP A5)       | **S** | Recomendado   |
| R-011 | HU-SEC-04 | Swagger UI accesible en producción por profile mal configurado                         | Configuración errónea (OWASP A5), código nuevo          | **S** | Recomendado   |
| R-012 | HU-SEC-04 | Puertos de bases de datos expuestos al host en docker-compose de producción           | Configuración errónea, integraciones externas           | **S** | Recomendado   |
| R-013 | HU-SEC-05 | Lógica de refresh token no implementada — sesiones que expiran sin aviso al usuario   | Funcionalidad alta frecuencia, experiencia de usuario   | **D** | Opcional      |
| R-014 | HU-SEC-04 | CORS configurado con wildcard `*` en ambiente de desarrollo dificulta diagnóstico en prod | Configuración, alcance limitado (solo dev)           | **D** | Opcional      |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Inyección / forjado de headers `X-Role` y `X-User-Id`

- **Descripción**: Un atacante puede fabricar requests HTTP con headers `X-Role: ADMIN` y `X-User-Id: <uuid>` y enviarlos directamente a los microservicios downstream si no hay validación en el gateway. Este es actualmente el vector de ataque más crítico del sistema.
- **Mitigación técnica**:
  1. El `JwtAuthenticationFilter` del gateway debe **eliminar** los headers `X-Role` y `X-User-Id` del request entrante antes de procesarlo.
  2. Luego de validar el JWT, el filtro inyecta los headers desde los claims del token.
  3. Los microservicios downstream (`ms-events`, `ms-ticketing`) no deben aceptar requests directos (sin pasar por el gateway) en producción.
- **Tests obligatorios**:
  - Test de integración: header `X-Role: ADMIN` sin token JWT → microservicio downstream NO recibe ese header.
  - Test de integración: header `X-Role: ADMIN` con token válido de rol BUYER → downstream recibe `X-Role: BUYER`.
  - Test de seguridad: request directo a microservicio con header forjado (validar que docker-compose prod no expone puertos).
- **Bloqueante para release**: ✅ Sí

---

### R-002: Tokens expirados no detectados en el frontend

- **Descripción**: Si el frontend no verifica la expiración del JWT antes de usarlo, puede enviar tokens expirados al backend. El backend los rechazará con 401, pero si el frontend no maneja ese 401 correctamente, el usuario quedará en un estado inconsistente (cree estar autenticado pero no puede hacer nada).
- **Mitigación técnica**:
  1. El interceptor Axios debe capturar respuestas HTTP 401 y redirigir al login.
  2. El frontend debe decodificar el JWT y verificar el claim `exp` antes de cada request sensible.
  3. Si quedan menos de 30 minutos para expirar, iniciar renovación silenciosa.
  4. Al detectar expiración: limpiar sessionStorage y redirigir a `/admin/login`.
- **Tests obligatorios**:
  - Test unitario: `AuthContext` con token expirado redirige a login.
  - Test unitario: interceptor Axios maneja 401 y limpia sesión.
  - Test de integración: refresh automático cuando `exp - now < 30min`.
- **Bloqueante para release**: ✅ Sí

---

### R-003: Contraseña del admin seed débil o expuesta

- **Descripción**: El administrador inicial se crea vía Flyway migration o CommandLineRunner. Si la contraseña proviene de una variable de entorno con valor por defecto débil (e.g., `admin123`), o si está hardcodeada en el migration SQL, cualquier atacante con acceso al código puede comprometer la cuenta.
- **Mitigación técnica**:
  1. `ADMIN_EMAIL` y `ADMIN_PASSWORD` deben ser variables de entorno obligatorias (sin valor por defecto).
  2. El seed debe fallar explícitamente al arrancar si las variables no están definidas.
  3. La contraseña sembrada debe pasar por BCrypt (cost >= 10) antes de insertarse en la BD.
  4. El migration SQL no debe contener contraseñas en texto plano.
  5. `.env.example` con placeholders; `.env` en `.gitignore`.
- **Tests obligatorios**:
  - Test de configuración: arranccar sin `ADMIN_PASSWORD` → la aplicación falla con mensaje claro.
  - Test de integración: el hash de la contraseña del admin seed cumple format BCrypt `$2a$10$...`.
  - Análisis estático: no existen strings como `admin123`, `password`, `secret` en archivos de migration.
- **Bloqueante para release**: ✅ Sí

---

### R-004: Rate limiting en memoria — se pierde en reinicio

- **Descripción**: Bucket4j con `ConcurrentHashMap` pierde todos los contadores de intentos fallidos cuando el proceso se reinicia. Un atacante puede evadir el rate limiting simplemente provocando un reinicio del contenedor (OOM, SIGTERM) entre intentos de fuerza bruta.
- **Mitigación técnica**:
  1. **Para MVP**: aceptar esta limitación y documentarla explícitamente.
  2. Asegurar que el contenedor tenga health checks para detectar reinicios anómalos.
  3. Registrar en logs los intentos fallidos con IP y timestamp para correlación manual.
  4. **Post-MVP**: migrar contadores a Redis (persistente entre reinicios).
- **Tests obligatorios**:
  - Test de integración: 5 intentos fallidos en la misma IP → 6to intento retorna 429.
  - Test de integración: el rate limit se aplica por IP, no por usuario.
  - Test de documentación: la limitación está documentada como deuda técnica conocida.
- **Bloqueante para release**: ✅ Sí (el rate limiting en memoria debe funcionar correctamente aunque sea volátil)

---

### R-005: Coexistencia de Spring MVC y Spring WebFlux

- **Descripción**: El api-gateway actualmente puede estar usando Spring WebFlux (Stack reactivo, típico de Spring Cloud Gateway). Integrar Spring Security + JPA (bloqueante/imperativo) en un contexto reactivo causa conflictos de autoconfiguración. Mezclar ambos stacks en el mismo proceso es una fuente frecuente de errores sutiles de runtime.
- **Mitigación técnica**:
  1. Decidir explícitamente el stack antes de implementar: Spring MVC (servlet) o Spring WebFlux (reactivo).
  2. Si se usa Spring Cloud Gateway (reactivo), implementar `JwtAuthenticationFilter` como `GatewayFilter` reactivo (no `OncePerRequestFilter`).
  3. Si se migra a Spring MVC, eliminar dependencias WebFlux.
  4. Verificar que el `SecurityFilterChain` usa el tipo correcto para el stack elegido.
- **Tests obligatorios**:
  - Test de arranque: la aplicación arranca sin errores de autoconfiguración.
  - Test de integración: el filtro JWT se ejecuta correctamente en el flujo de request.
  - Test de smoke: todos los endpoints responden con el código HTTP esperado.
- **Bloqueante para release**: ✅ Sí

---

### R-006: Clave privada RS256 expuesta o insuficientemente protegida

- **Descripción**: La clave privada RS256 usada para firmar JWTs es el activo más crítico del sistema de autenticación. Si se expone (hardcodeada en código, en logs, en variables de entorno visibles), un atacante puede generar tokens válidos con cualquier identidad y rol.
- **Mitigación técnica**:
  1. La clave privada debe residir **únicamente** en una variable de entorno o sistema de secrets (HashiCorp Vault, AWS Secrets Manager).
  2. Nunca incluir la clave en archivos de código, `application.yml`, ni logs.
  3. En desarrollo, generar un par de claves efímeras en runtime; en producción, desde variables de entorno.
  4. El archivo `.env.example` debe mostrar solo el nombre de la variable, nunca un valor real.
- **Tests obligatorios**:
  - Análisis estático: no existe ningún string de clave privada PEM en el repositorio.
  - Test de configuración: la clave se carga desde variable de entorno correctamente.
  - Test de seguridad: un token firmado con una clave diferente es rechazado por el gateway.
- **Bloqueante para release**: ✅ Sí

---

### R-007: BCrypt con cost factor insuficiente

- **Descripción**: Si BCrypt se configura con cost factor < 10, los hashes pueden ser atacados por fuerza bruta en hardware moderno en tiempo razonable. Spring Security usa cost factor 10 por defecto, pero puede ser sobreescrito accidentalmente.
- **Mitigación técnica**:
  1. Configurar explícitamente `BCryptPasswordEncoder(10)` o superior.
  2. No aceptar configuración dinámica del cost factor desde properties externas.
  3. Documentar el valor elegido como constante en el código.
- **Tests obligatorios**:
  - Test unitario: `BCryptPasswordEncoder` está configurado con strength >= 10.
  - Test de integración: al registrar un usuario, el hash almacenado comienza con `$2a$10$` o `$2b$10$`.
- **Bloqueante para release**: ✅ Sí

---

### R-008: JWT almacenado en `localStorage` (vulnerable a XSS)

- **Descripción**: Si el JWT se almacena en `localStorage`, cualquier script JavaScript ejecutado en el contexto de la página (XSS) puede leerlo y enviarlo a un servidor del atacante. Según la spec, el almacenamiento debe ser en memoria React con fallback a `sessionStorage`.
- **Mitigación técnica**:
  1. Almacenar el JWT en estado React (`useState`) como primera opción.
  2. Usar `sessionStorage` como fallback (se elimina al cerrar la pestaña).
  3. **Nunca** usar `localStorage` para el JWT.
  4. El interceptor Axios debe leer el token desde el estado React, no desde storage.
- **Tests obligatorios**:
  - Test unitario: después del login, `localStorage.getItem('token')` retorna null.
  - Test unitario: `sessionStorage` contiene el token y `localStorage` no.
  - Test de seguridad: simulación de XSS — acceso a `localStorage` no retorna JWT.
- **Bloqueante para release**: ✅ Sí

---

## Riesgos MEDIO — Plan de Mitigación

### R-009: Endpoint de registro accesible sin autenticación correcta
- **Mitigación**: Verificar en test de integración que `POST /api/v1/auth/register` retorna 401 sin token y 403 con token de rol BUYER.
- **Bloqueante**: ❌ No (pero debe documentarse si se omite el test)

### R-010: Mensaje de error diferenciado en login (information disclosure)
- **Mitigación**: Test de seguridad que compara el body de respuesta para email inexistente vs contraseña incorrecta — deben ser idénticos.
- **Bloqueante**: ❌ No

### R-011: Swagger UI accesible en producción
- **Mitigación**: Test de smoke en profile prod: `GET /swagger-ui.html` → 404.
- **Bloqueante**: ❌ No (pero representa exposición de superficie de ataque)

### R-012: Puertos de bases de datos expuestos en producción
- **Mitigación**: Revisión de `docker-compose.prod.yml` — verificar ausencia de `ports:` en servicios de BD.
- **Bloqueante**: ❌ No (pero crítico en ambientes cloud)

---

## Relación con OWASP Top 10 (2021)

| OWASP          | Categoría                              | Riesgos Relacionados |
|----------------|----------------------------------------|----------------------|
| A01:2021       | Broken Access Control                  | R-001, R-009         |
| A02:2021       | Cryptographic Failures                 | R-006, R-007         |
| A03:2021       | Injection / XSS                        | R-008                |
| A04:2021       | Insecure Design                        | R-004, R-005         |
| A05:2021       | Security Misconfiguration              | R-003, R-011, R-012  |
| A06:2021       | Vulnerable Components                  | R-005                |
| A07:2021       | Identification & Authentication Failures | R-002, R-007, R-010 |
| A09:2021       | Security Logging & Monitoring Failures | R-004                |
