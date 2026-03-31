---
id: SPEC-020
status: APPROVED
feature: sprint1-seguridad-jwt-gateway-login
created: 2026-03-31
updated: 2026-03-31
author: spec-generator
version: "1.0"
related-specs: [SPEC-014]
---

# Spec: Sprint 1 — Cimientos de Seguridad: JWT, Gateway Filter, Login Real

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Implementar autenticación real con JWT en el api-gateway como punto único de seguridad, reemplazar la propagación de headers falsificables por claims verificados del token, securizar credenciales de infraestructura, y crear la pantalla de login real del administrador en el frontend eliminando credenciales hardcodeadas.

### Requerimiento de Negocio
El sistema de ticketing carece de autenticación real: no hay Spring Security, las credenciales del admin están hardcodeadas en el frontend, los headers `X-Role` son falsificables por cualquier cliente HTTP, y las credenciales de infraestructura usan valores por defecto. Este sprint cierra todas las vulnerabilidades críticas de autenticación.

### Historias de Usuario

#### HU-SEC-04: Securización de configuración y credenciales

```
Como:        DevOps
Quiero:      que las credenciales de infraestructura sean seguras y no estén hardcodeadas
Para:        prevenir accesos no autorizados a bases de datos y servicios de mensajería

Prioridad:   Crítica
Estimación:  S (3 SP)
Dependencias: Ninguna
Capa:        Backend (config/infra)
```

#### Criterios de Aceptación — HU-SEC-04

**Happy Path**
```gherkin
CRITERIO-4.1: Credenciales configuradas por entorno
  Dado que:  el sistema se despliega en un ambiente
  Cuando:    se revisa la configuración
  Entonces:  las contraseñas de PostgreSQL no son "postgres"
  Y las credenciales de RabbitMQ no son "guest/guest"
  Y el secreto de servicio no contiene "dev-secret"
  Y todas las credenciales provienen de variables de entorno o secrets
```

```gherkin
CRITERIO-4.2: CORS restringido
  Dado que:  el API Gateway tiene configuración CORS
  Cuando:    se revisa la configuración
  Entonces:  allowedOrigins lista orígenes específicos (no wildcard "*")
  Y allowedHeaders lista headers específicos permitidos
```

```gherkin
CRITERIO-4.3: Swagger deshabilitado en producción
  Dado que:  el sistema se ejecuta con profile "prod"
  Cuando:    un usuario intenta acceder a "/swagger-ui.html"
  Entonces:  recibe un error 404
  Y el endpoint "/v3/api-docs" tampoco es accesible
```

```gherkin
CRITERIO-4.4: Solo el gateway expone puerto al exterior
  Dado que:  el sistema se ejecuta con Docker Compose de producción
  Cuando:    se revisan los puertos expuestos
  Entonces:  solo el puerto del API Gateway (8080) está expuesto al host
  Y los puertos de PostgreSQL y RabbitMQ no tienen binding al host
```

---

#### HU-SEC-01: Registro y login de administrador con JWT

```
Como:        Administrador
Quiero:      autenticarme contra el sistema con credenciales reales y recibir un token JWT
Para:        que solo usuarios verificados puedan acceder al panel de administración

Prioridad:   Crítica
Estimación:  L (8 SP)
Dependencias: Ninguna
Capa:        Backend (api-gateway)
```

#### Criterios de Aceptación — HU-SEC-01

**Happy Path**
```gherkin
CRITERIO-1.1: Login exitoso genera JWT válido
  Dado que:  existe un usuario administrador registrado en el sistema
  Cuando:    envía credenciales válidas a POST /api/v1/auth/login
  Entonces:  recibe un token JWT firmado con role "ADMIN"
  Y el token tiene expiración configurada (por defecto 8 horas)
  Y el response incluye el token en el body (no en cookie)
```

**Error Path**
```gherkin
CRITERIO-1.2: Credenciales inválidas
  Dado que:  existe un usuario administrador registrado
  Cuando:    envía credenciales incorrectas a POST /api/v1/auth/login
  Entonces:  recibe un error 401 Unauthorized
  Y el mensaje no revela si el error fue en email o contraseña
```

```gherkin
CRITERIO-1.3: Contraseña almacenada con hash seguro
  Dado que:  se registra un nuevo usuario administrador
  Cuando:    se persiste en la base de datos
  Entonces:  la contraseña se almacena con BCrypt (cost factor >= 10)
  Y nunca aparece en texto plano en logs ni responses
```

```gherkin
CRITERIO-1.4: Rate limiting en endpoint de login
  Dado que:  un cliente ha fallado el login 5 veces en los últimos 15 minutos
  Cuando:    intenta un sexto login
  Entonces:  recibe un error 429 Too Many Requests
  Y debe esperar antes de reintentar
```

---

#### HU-SEC-02: Validación de JWT en el API Gateway y propagación segura

```
Como:        Sistema
Quiero:      que el API Gateway valide los tokens JWT en cada request a endpoints protegidos y propague la identidad verificada a los microservicios downstream
Para:        eliminar la posibilidad de falsificación de headers de identidad

Prioridad:   Crítica
Estimación:  L (8 SP)
Dependencias: HU-SEC-01
Capa:        Backend (api-gateway, ms-events, ms-ticketing)
```

#### Criterios de Aceptación — HU-SEC-02

**Happy Path**
```gherkin
CRITERIO-2.1: Gateway valida JWT y propaga claims como headers internos
  Dado que:  un administrador tiene un JWT válido
  Cuando:    envía request al gateway con header "Authorization: Bearer <token>"
  Entonces:  el gateway verifica la firma del JWT
  Y extrae los claims (userId, role)
  Y propaga "X-User-Id" y "X-Role" como headers internos al microservicio destino
  Y elimina cualquier header "X-Role" o "X-User-Id" enviado por el cliente
```

**Error Path**
```gherkin
CRITERIO-2.2: Request sin token a endpoint protegido es rechazado
  Dado que:  un cliente no envía header "Authorization"
  Cuando:    intenta acceder a "POST /api/v1/events"
  Entonces:  recibe un error 401 Unauthorized
  Y el request nunca llega al microservicio downstream
```

```gherkin
CRITERIO-2.3: Endpoints públicos permanecen accesibles sin token
  Dado que:  un comprador anónimo no tiene cuenta ni token
  Cuando:    accede a "GET /api/v1/events" o "GET /api/v1/events/{id}"
  Entonces:  recibe la respuesta normal sin necesidad de autenticación
```

```gherkin
CRITERIO-2.4: Headers del cliente no pueden sobrescribir la identidad
  Dado que:  un cliente envía manualmente "X-Role: ADMIN" sin token JWT válido
  Cuando:    el request llega al gateway
  Entonces:  el gateway elimina los headers "X-Role" y "X-User-Id" del request
  Y el request se procesa como anónimo (sin identidad)
```

---

#### HU-SEC-05: Pantalla de login real para administrador

```
Como:        Administrador
Quiero:      una pantalla de login que valide mis credenciales contra el backend
Para:        no depender de credenciales hardcodeadas en el código fuente del frontend

Prioridad:   Crítica
Estimación:  M (5 SP)
Dependencias: HU-SEC-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-SEC-05

**Happy Path**
```gherkin
CRITERIO-5.1: Login contra API real
  Dado que:  el administrador está en la página "/admin/login"
  Cuando:    ingresa email y contraseña válidos y presiona "Iniciar Sesión"
  Entonces:  el frontend envía las credenciales a "POST /api/v1/auth/login"
  Y almacena el JWT recibido de forma segura
  Y redirige al dashboard de administración "/admin/events"
```

**Error Path**
```gherkin
CRITERIO-5.2: Credenciales inválidas en UI
  Dado que:  el administrador está en la página "/admin/login"
  Cuando:    ingresa credenciales incorrectas
  Entonces:  muestra un mensaje de error genérico "Credenciales inválidas"
  Y no revela si el error fue en email o contraseña
  Y el campo de contraseña se limpia
```

```gherkin
CRITERIO-5.3: Sin credenciales en código fuente
  Dado que:  se revisa el código del frontend
  Cuando:    se buscan strings como "admin@sem7.com" o "admin123"
  Entonces:  no existen credenciales hardcodeadas en ningún archivo
```

```gherkin
CRITERIO-5.4: Token JWT renovado automáticamente
  Dado que:  el administrador está autenticado con un JWT
  Y el token expira en menos de 30 minutos
  Cuando:    realiza una acción en el panel
  Entonces:  el frontend solicita un nuevo token automáticamente
  Y actualiza el almacenamiento sin interrumpir la sesión
```

### Reglas de Negocio

1. **JWT firmado con RS256**: clave privada en api-gateway, clave pública compartida para verificación.
2. **Token en body, no en cookies**: el response de login devuelve `{ "token": "...", "expiresIn": 28800 }`.
3. **BCrypt cost factor >= 10**: para almacenar contraseñas de forma segura.
4. **Rate limiting**: 5 intentos fallidos / 15 min por IP en endpoint de login.
5. **Admin inicial vía seed**: el primer administrador se crea con Flyway migration o CommandLineRunner.
6. **Registro de admin protegido**: solo un ADMIN existente puede crear otro ADMIN (`POST /api/v1/auth/register`).
7. **Endpoints públicos**: `GET /api/v1/events`, `GET /api/v1/events/{id}`, `GET /api/v1/events/{id}/tiers`, `POST /api/v1/auth/login`.
8. **Endpoints protegidos (ADMIN)**: `POST /api/v1/events`, `PUT /api/v1/events/{id}`, `POST /api/v1/events/{id}/tiers`, todo bajo `/api/v1/rooms`.
9. **Frontend almacena JWT en memoria** (React state) con fallback a `sessionStorage` (nunca `localStorage`).
10. **CORS restringido**: orígenes específicos (`http://localhost:5173` en dev, dominio en prod). No wildcard `*`.
11. **Swagger UI**: habilitado solo con profile `dev`.
12. **Credenciales de infra**: `.env.example` con placeholders; `.env` en `.gitignore`.
13. **Docker Compose prod**: solo API Gateway (puerto 8080) expuesto al host.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `User` | tabla `users` (BD api-gateway) | nueva | Usuario del sistema (ADMIN o BUYER) |

#### Campos del modelo — `User`
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `id` | UUID | sí | auto-generado | Identificador único |
| `email` | VARCHAR(255) | sí | formato email, unique | Email del usuario |
| `password_hash` | VARCHAR(255) | sí | BCrypt hash | Hash de la contraseña |
| `role` | VARCHAR(20) | sí | `ADMIN` o `BUYER` | Rol del usuario |
| `created_at` | TIMESTAMP | sí | auto UTC | Timestamp de creación |
| `updated_at` | TIMESTAMP | sí | auto UTC | Timestamp de actualización |

#### Índices / Constraints
- `UNIQUE INDEX idx_users_email ON users(email)` — unicidad de email, búsqueda frecuente en login
- `INDEX idx_users_role ON users(role)` — filtrado por rol

#### Base de datos para api-gateway
El api-gateway actualmente no tiene base de datos propia. Se requiere:
- Agregar servicio PostgreSQL `postgres-gateway` en `docker-compose.yml`
- Agregar dependencias `spring-boot-starter-data-jpa`, `postgresql` en `build.gradle`
- Configurar datasource en `application.yml`

### API Endpoints

#### POST /api/v1/auth/login
- **Descripción**: Autentica un usuario (ADMIN o BUYER) y retorna JWT
- **Auth requerida**: no
- **Microservicio**: api-gateway
- **Request Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "securePassword123"
  }
  ```
- **Response 200**:
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 28800,
    "role": "ADMIN"
  }
  ```
- **Response 401**: `{ "error": "Credenciales inválidas" }` — mensaje genérico, sin revelar campo incorrecto
- **Response 429**: `{ "error": "Demasiados intentos. Intente de nuevo más tarde" }` — rate limiting

#### POST /api/v1/auth/register
- **Descripción**: Registra un nuevo administrador (solo ADMIN puede crear ADMIN)
- **Auth requerida**: sí (JWT con role ADMIN)
- **Microservicio**: api-gateway
- **Request Body**:
  ```json
  {
    "email": "newadmin@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response 201**:
  ```json
  {
    "id": "uuid",
    "email": "newadmin@example.com",
    "role": "ADMIN",
    "created_at": "2026-03-31T10:00:00Z"
  }
  ```
- **Response 400**: validación fallida (email inválido, contraseña débil)
- **Response 401**: token ausente o inválido
- **Response 403**: rol insuficiente (no ADMIN)
- **Response 409**: email ya registrado

### Diseño Frontend

#### Componentes modificados
| Componente | Archivo | Cambios | Descripción |
|------------|---------|---------|-------------|
| `AuthContext` | `contexts/AuthContext.tsx` | refactorizar | Eliminar `DEMO_EMAIL`/`DEMO_PASSWORD`, usar `authService` real |
| `AdminLogin` | `pages/AdminLogin.tsx` | refactorizar | Llamar a `authService.login()` en lugar de validación local |
| `AdminGuard` | `components/AdminGuard.tsx` | refactorizar | Verificar JWT válido, no solo presencia en storage |

#### Componentes nuevos
| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| — | — | — | No se crean componentes nuevos; se refactorizan existentes |

#### Services (llamadas API)
| Función | Archivo | Endpoint |
|---------|---------|---------|
| `login(email, password)` | `services/authService.ts` | `POST /api/v1/auth/login` |
| `refreshToken()` | `services/authService.ts` | `POST /api/v1/auth/refresh` (si se implementa) |
| `getProfile()` | `services/authService.ts` | `GET /api/v1/auth/me` |

### Arquitectura y Dependencias

#### api-gateway — nuevas dependencias
- `org.springframework.boot:spring-boot-starter-security`
- `org.springframework.boot:spring-boot-starter-data-jpa`
- `org.postgresql:postgresql`
- `io.jsonwebtoken:jjwt-api:0.12.5`
- `io.jsonwebtoken:jjwt-impl:0.12.5`
- `io.jsonwebtoken:jjwt-jackson:0.12.5`
- `com.bucket4j:bucket4j-core` (para rate limiting) o Spring Cloud Gateway built-in rate limiter

#### Componentes nuevos en api-gateway
| Componente | Paquete | Responsabilidad |
|------------|---------|-----------------|
| `User` (entity) | `model/` | Entidad JPA para usuarios |
| `UserRepository` | `repository/` | Acceso a tabla `users` |
| `JwtService` | `security/` | Generación y validación de JWT RS256 |
| `AuthController` | `controller/` | Endpoints `/api/v1/auth/*` |
| `AuthService` | `service/` | Lógica de login/registro |
| `JwtAuthenticationFilter` | `security/` | Filtro global del gateway — valida JWT y propaga claims |
| `SecurityConfig` | `config/` | `SecurityFilterChain` con endpoints públicos/protegidos |
| `RateLimitFilter` | `security/` | Limita intentos de login por IP |

#### Cambios en microservicios downstream
- `ms-events`: refactorizar controllers para confiar en headers `X-User-Id`/`X-Role` inyectados por gateway (ya lo hacen, pero se debe eliminar posibilidad de forjar).
- `ms-ticketing`: ídem.
- Refactorizar `HeaderPropagationFilterConfig` en api-gateway para **eliminar** headers del cliente y solo propagar los extraídos del JWT.

### Notas de Implementación

1. **Par de claves RS256**: generar en runtime o cargar desde archivo. En desarrollo, se puede usar un par embebido; en producción, desde variables de entorno o vault.
2. **Seed del admin**: crear administrador inicial con email y contraseña configurable por variables de entorno (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
3. **Rate limiting**: usar Bucket4j con caché en memoria (ConcurrentHashMap por IP). No requiere Redis para MVP.
4. **Flyway**: crear migration `V1__create_users_table.sql` para la tabla `users` e insertar admin seed.
5. **Profile `dev` vs `prod`**: CORS permisivo + Swagger ON en dev; CORS restringido + Swagger OFF en prod.
6. **docker-compose.prod.yml**: copiar `docker-compose.yml` sin port bindings de PostgreSQL ni RabbitMQ.
7. **`.env.example`**: incluir todas las variables necesarias con valores placeholder.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend

#### HU-SEC-04 — Configuración y credenciales
- [ ] Crear `.env.example` con variables placeholder para PostgreSQL, RabbitMQ, JWT, admin seed
- [ ] Verificar que `.env` está en `.gitignore`
- [ ] Crear `docker-compose.prod.yml` sin port bindings internos (solo gateway :8080)
- [ ] Configurar profiles de Spring: `dev` (Swagger on, CORS permisivo) vs `prod` (Swagger off, CORS restringido)
- [ ] Restringir CORS en api-gateway: orígenes específicos en lugar de wildcard `*`
- [ ] Cambiar `logging.level` a INFO en profile `prod`

#### HU-SEC-01 — Login de administrador con JWT
- [ ] Agregar dependencias: `spring-boot-starter-security`, `spring-boot-starter-data-jpa`, `postgresql`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson`
- [ ] Agregar servicio PostgreSQL `postgres-gateway` en `docker-compose.yml`
- [ ] Crear migration Flyway `V1__create_users_table.sql`
- [ ] Crear entidad `User` con campos: `id`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`
- [ ] Crear `UserRepository` con `findByEmail()`
- [ ] Implementar `JwtService` — generación y validación de tokens RS256
- [ ] Implementar `AuthService` — lógica de login con BCrypt y registro protegido
- [ ] Implementar `AuthController` con `POST /api/v1/auth/login` y `POST /api/v1/auth/register`
- [ ] Configurar `SecurityFilterChain` permitiendo endpoints públicos y protegiendo admin
- [ ] Seed de administrador inicial vía Flyway migration o CommandLineRunner
- [ ] Implementar rate limiting con Bucket4j (5 intentos / 15 min por IP)

#### HU-SEC-02 — Validación JWT en Gateway y propagación segura
- [ ] Refactorizar `HeaderPropagationFilterConfig` para eliminar headers `X-Role`/`X-User-Id` del request entrante del cliente
- [ ] Implementar `JwtAuthenticationFilter` (filtro global gateway): extraer Bearer token → validar firma → extraer claims → inyectar headers internos `X-User-Id` y `X-Role`
- [ ] Definir lista de endpoints públicos vs protegidos en configuración YAML
- [ ] Verificar que controllers de `ms-events` confían solo en headers inyectados por gateway
- [ ] Verificar que controllers de `ms-ticketing` confían solo en headers inyectados por gateway

#### Tests Backend
- [ ] Test: login exitoso genera JWT con claims correctos (`sub`, `role`, `exp`, `iat`)
- [ ] Test: login fallido retorna 401 sin leak de información
- [ ] Test: contraseña almacenada con BCrypt en BD
- [ ] Test: rate limiting bloquea al 6to intento
- [ ] Test: token expirado retorna 401
- [ ] Test: token mal formado retorna 401
- [ ] Test: `X-Role` forjado por cliente es eliminado por gateway
- [ ] Test: endpoint admin sin token retorna 401
- [ ] Test: endpoint público funciona sin token
- [ ] Test: claims del JWT se propagan correctamente como headers internos

### Frontend

#### HU-SEC-05 — Login real del administrador
- [ ] Crear `services/authService.ts` con funciones: `login(email, password)`, `refreshToken()`, `getProfile()`
- [ ] Refactorizar `AuthContext.tsx` — eliminar `DEMO_EMAIL`, `DEMO_PASSWORD` y validación local
- [ ] Implementar almacenamiento de JWT en memoria (estado React) con fallback a `sessionStorage`
- [ ] Crear interceptor Axios para inyectar `Authorization: Bearer <token>` en cada request
- [ ] Crear interceptor Axios para detectar 401 y redirigir a login
- [ ] Actualizar componente `AdminLogin` para llamar a `authService.login()`
- [ ] Implementar lógica de refresh token silencioso
- [ ] Actualizar `AdminGuard` para verificar token válido (no solo presencia en storage)

#### Tests Frontend
- [ ] Test: login exitoso redirige a dashboard
- [ ] Test: credenciales inválidas muestran error genérico
- [ ] Test: no hay credenciales hardcodeadas en el bundle
- [ ] Test: token expirado redirige a login
- [ ] Test: `sessionStorage` se limpia al cerrar sesión

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios 1.1–1.4, 2.1–2.4, 4.1–4.4, 5.1–5.4
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos de seguridad
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar que todas las reglas de negocio están cubiertas
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
