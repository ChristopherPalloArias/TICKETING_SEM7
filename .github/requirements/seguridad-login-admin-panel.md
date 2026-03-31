# Requerimiento: Seguridad, Autenticación y Mejoras del Panel de Administración

## Contexto del feature

### Problema actual

La auditoría de seguridad del sistema de ticketing revela vulnerabilidades críticas en todas las capas de la aplicación:

#### 1. Ausencia total de autenticación real
- **No existe Spring Security** en ningún microservicio. La spec original declara explícitamente "NO usar Spring Security en este MVP".
- **Credenciales hardcodeadas** en el frontend: `admin@sem7.com` / `admin123` están en código fuente (`AuthContext.tsx`).
- La sesión de administrador se almacena en `localStorage` como JSON plano — vulnerable a XSS.
- No hay mecanismo de login real contra un backend: la validación es 100% client-side.

#### 2. Autorización por headers falsificables
- Los endpoints admin del backend se protegen con headers `X-Role: ADMIN` y `X-User-Id` que **el cliente envía libremente**.
- El `api-gateway` propaga estos headers sin validarlos (`HeaderPropagationFilterConfig.java`).
- Cualquier consumidor HTTP puede forjar `X-Role: ADMIN` y acceder a endpoints de administración.
- La autenticación inter-servicio (`X-Service-Auth`) usa un secreto estático en texto plano (`dev-secret-change-in-production`).

#### 3. CORS permisivo y superficie de ataque expuesta
- CORS configurado con `allowedOrigins: "*"` y `allowedHeaders: "*"` en el api-gateway.
- Swagger UI con "Try-It-Out" habilitado en todos los microservicios, accesible sin autenticación.
- Todos los puertos de PostgreSQL (5433, 5434, 5435) y RabbitMQ (5672, 15672) expuestos al host.

#### 4. Credenciales por defecto en infraestructura
- PostgreSQL: `postgres/postgres` en los 3 databases.
- RabbitMQ: `guest/guest` (credenciales de fábrica).
- Sin rotación de secretos ni vault de credenciales.

#### 5. Panel de administración limitado
- No hay edición de eventos después de la creación.
- No hay cancelación de eventos (solo publicar, sin vuelta atrás).
- No hay visibilidad de reservas/tickets vendidos por evento.
- No hay búsqueda ni paginación en el dashboard.
- No hay métricas ni analítica básica.
- No hay gestión de salas (solo selector al crear evento).
- La navegación es mínima: solo navbar fijo con logo + email + logout.

#### 6. Compra sin registro debe mantenerse
- El flujo actual permite comprar tickets sin registro (comprador anónimo identificado por `buyerId` UUID).
- **Requerimiento explícito**: no eliminar esta funcionalidad. Los compradores ocasionales deben poder comprar sin crear cuenta.

### Solución propuesta

Implementar seguridad real en todo el stack, añadir login opcional para compradores, y mejorar el panel de administración:

1. **Backend**: Spring Security + JWT en api-gateway como punto único de autenticación. Los microservicios internos confían en tokens validados por el gateway.
2. **Frontend**: Login real contra API, almacenamiento seguro de tokens, interceptores Axios centralizados.
3. **Compra sin registro**: Mantener flujo anónimo con `buyerId` generado. Opcionalmente, el comprador puede registrarse para ver historial.
4. **Admin panel**: CRUD completo de eventos, gestión de salas, dashboard con métricas, navegación mejorada.
5. **Tickets y perfil**: Vista real de tickets del comprador autenticado, asociación de compras anónimas al registrarse, descarga de tickets en PDF, y perfil básico con cambio de contraseña.

### Restricciones

- **No romper el flujo de compra anónima**: los compradores sin cuenta siguen pudiendo reservar y pagar.
- **JWT firmados por el gateway**: los microservicios downstream validan firma, no emiten tokens propios.
- **Rol `BUYER` opcional**: un comprador registrado obtiene JWT con role `BUYER`. Un comprador anónimo no envía token.
- **Rol `ADMIN` obligatorio**: toda operación administrativa requiere JWT válido con role `ADMIN`.
- **Compatibilidad**: las APIs existentes mantienen compatibilidad backward. Los endpoints públicos (cartelera, detalle de evento) permanecen abiertos.

**Capas afectadas:** `api-gateway`, `ms-events`, `ms-ticketing`, `ms-notifications`, `frontend`
**Stack:** Java 17+, Spring Boot 3.x, Spring Security, JWT (jjwt), PostgreSQL, iText/PDFBox (PDF), React, TypeScript, Axios

---

## Escala de estimación
Fibonacci: 1, 2, 3, 5, 8, 13

## Definition of Ready (DoR)
- Formato Como / Quiero / Para redactado correctamente
- Valor de negocio identificable y claro
- Criterios de aceptación definidos en Gherkin
- Estimación en Story Points asignada

## Definition of Done (DoD)
- Formato Como / Quiero / Para completo y claro
- Criterios de aceptación escritos en Gherkin declarativo
- Escenarios cubren el camino feliz y los casos alternos o límite
- Tasking desglosado desde la perspectiva DEV y QA
- Estimación en Story Points asignada y justificada
- Commit atómico subido al repositorio con mensaje descriptivo

---

## Épica 1: Seguridad Backend — Autenticación y Autorización con JWT

### HU-SEC-01: Registro y login de administrador con JWT — SP: 8

Como **Administrador**
Quiero autenticarme contra el sistema con credenciales reales y recibir un token JWT
Para que solo usuarios verificados puedan acceder al panel de administración

**Microservicio:** `api-gateway`
**Prioridad:** Crítica
**Justificación SP:** Requiere integrar Spring Security, crear entidad `User`, endpoint de login, generación de JWT firmado con clave asimétrica (RS256), y validación de credenciales contra BD. Es la base de toda la seguridad del sistema.

#### Criterios de Aceptación

**CA-01. Login exitoso genera JWT válido**
```gherkin
Escenario: Login exitoso de administrador
  Dado que existe un usuario administrador registrado en el sistema
  Cuando envía sus credenciales válidas al endpoint de login
  Entonces recibe un token JWT firmado con role "ADMIN"
  Y el token tiene una expiración configurada (por defecto 8 horas)
  Y el response incluye el token en el body (no en cookie)
```

**CA-02. Login fallido por credenciales inválidas**
```gherkin
Escenario: Credenciales inválidas
  Dado que existe un usuario administrador registrado
  Cuando envía credenciales incorrectas al endpoint de login
  Entonces recibe un error 401 Unauthorized
  Y el mensaje no revela si el error fue en email o contraseña
```

**CA-03. Contraseña almacenada con hash seguro**
```gherkin
Escenario: Contraseña hasheada en base de datos
  Dado que se registra un nuevo usuario administrador
  Cuando se persiste en la base de datos
  Entonces la contraseña se almacena con BCrypt (cost factor ≥ 10)
  Y nunca aparece en texto plano en logs ni responses
```

**CA-04. Rate limiting en endpoint de login**
```gherkin
Escenario: Límite de intentos de login
  Dado que un cliente ha fallado el login 5 veces en los últimos 15 minutos
  Cuando intenta un sexto login
  Entonces recibe un error 429 Too Many Requests
  Y debe esperar antes de reintentar
```

#### Subtasks

**DEV**
- [ ] Agregar dependencias: `spring-boot-starter-security`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson`
- [ ] Crear entidad `User` con campos: `id`, `email`, `passwordHash`, `role`, `createdAt`, `updatedAt`
- [ ] Crear tabla `users` (Flyway migration) en la BD del api-gateway
- [ ] Implementar `JwtService` — generación y validación de tokens RS256
- [ ] Implementar `AuthController` con `POST /api/v1/auth/login`
- [ ] Implementar `POST /api/v1/auth/register` (protegido, solo ADMIN existente puede crear otro ADMIN)
- [ ] Configurar `SecurityFilterChain` permitiendo endpoints públicos y protegiendo admin
- [ ] Implementar `JwtAuthenticationFilter` como filtro global del gateway
- [ ] Seed de administrador inicial vía Flyway o CommandLineRunner
- [ ] Implementar rate limiting con Bucket4j o Redis (5 intentos / 15 min por IP)

**QA**
- [ ] Verificar login exitoso genera JWT con claims correctos (`sub`, `role`, `exp`, `iat`)
- [ ] Verificar login fallido retorna 401 sin leak de información
- [ ] Verificar contraseña almacenada con BCrypt en BD
- [ ] Verificar rate limiting bloquea al 6to intento
- [ ] Verificar token expirado retorna 401
- [ ] Verificar token mal formado retorna 401

---

### HU-SEC-02: Validación de JWT en el API Gateway y propagación segura — SP: 8

Como **Sistema**
Quiero que el API Gateway valide los tokens JWT en cada request a endpoints protegidos y propague la identidad verificada a los microservicios downstream
Para eliminar la posibilidad de falsificación de headers de identidad

**Microservicio:** `api-gateway`, `ms-events`, `ms-ticketing`
**Prioridad:** Crítica
**Dependencia:** HU-SEC-01

#### Criterios de Aceptación

**CA-01. Gateway valida JWT y propaga claims como headers internos**
```gherkin
Escenario: Request autenticado llega a microservicio downstream
  Dado que un administrador tiene un JWT válido
  Cuando envía un request al gateway con header "Authorization: Bearer <token>"
  Entonces el gateway verifica la firma del JWT
  Y extrae los claims (userId, role)
  Y propaga "X-User-Id" y "X-Role" como headers internos al microservicio destino
  Y elimina cualquier header "X-Role" o "X-User-Id" enviado por el cliente
```

**CA-02. Request sin token a endpoint protegido es rechazado**
```gherkin
Escenario: Acceso a endpoint admin sin token
  Dado que un cliente no envía header "Authorization"
  Cuando intenta acceder a "POST /api/v1/events"
  Entonces recibe un error 401 Unauthorized
  Y el request nunca llega al microservicio downstream
```

**CA-03. Endpoints públicos permanecen accesibles sin token**
```gherkin
Escenario: Acceso público a cartelera
  Dado que un comprador anónimo no tiene cuenta ni token
  Cuando accede a "GET /api/v1/events" o "GET /api/v1/events/{id}"
  Entonces recibe la respuesta normal sin necesidad de autenticación
```

**CA-04. Headers del cliente no pueden sobrescribir la identidad**
```gherkin
Escenario: Cliente intenta forjar headers de identidad
  Dado que un cliente envía manualmente "X-Role: ADMIN" sin token JWT válido
  Cuando el request llega al gateway
  Entonces el gateway elimina los headers "X-Role" y "X-User-Id" del request
  Y el request se procesa como anónimo (sin identidad)
```

#### Subtasks

**DEV**
- [ ] Refactorizar `HeaderPropagationFilterConfig` para eliminar headers `X-Role`/`X-User-Id` del request entrante
- [ ] Implementar `JwtGatewayFilter` que: extraiga Bearer token → valide firma → extraiga claims → inyecte headers internos
- [ ] Definir lista de endpoints públicos vs protegidos en configuración YAML
- [ ] Actualizar controllers de `ms-events` para confiar solo en headers inyectados por gateway
- [ ] Actualizar controllers de `ms-ticketing` para los mismos headers
- [ ] Implementar tests de integración con tokens válidos, expirados, y forjados

**QA**
- [ ] Verificar que `X-Role` forjado por cliente es eliminado por gateway
- [ ] Verificar que endpoint admin sin token retorna 401
- [ ] Verificar que endpoint público funciona sin token
- [ ] Verificar que claims del JWT se propagan correctamente como headers internos

---

### HU-SEC-03: Registro y login opcional de comprador — SP: 5

Como **Comprador**
Quiero poder crear una cuenta opcionalmente y autenticarme en el sistema
Para ver mi historial de compras y no tener que ingresar mis datos cada vez

**Microservicio:** `api-gateway`
**Prioridad:** Media
**Dependencia:** HU-SEC-01

#### Criterios de Aceptación

**CA-01. Registro de comprador con email y contraseña**
```gherkin
Escenario: Registro exitoso de comprador
  Dado que un visitante no tiene cuenta en el sistema
  Cuando envía email y contraseña al endpoint de registro de compradores
  Entonces se crea una cuenta con role "BUYER"
  Y recibe un JWT válido con role "BUYER"
  Y puede usar el token para futuras acciones autenticadas
```

**CA-02. Compra sin registro sigue funcionando**
```gherkin
Escenario: Compra anónima sin cambios
  Dado que un comprador no desea crear cuenta
  Cuando accede al detalle de un evento y selecciona tickets
  Entonces puede completar la reserva y pago sin autenticarse
  Y solo necesita proporcionar su email para la notificación
  Y recibe un buyerId transitorio generado por el sistema
```

**CA-03. Comprador autenticado no necesita ingresar email cada vez**
```gherkin
Escenario: Compra con cuenta autenticada
  Dado que un comprador tiene cuenta y está logueado con JWT
  Cuando inicia una reserva
  Entonces el sistema usa el email de su cuenta automáticamente
  Y asocia la reserva a su userId permanente (en lugar de buyerId transitorio)
```

**CA-04. Email duplicado rechazado**
```gherkin
Escenario: Registro con email existente
  Dado que ya existe una cuenta con el email "buyer@example.com"
  Cuando otro visitante intenta registrarse con el mismo email
  Entonces recibe un error 409 Conflict
  Y el mensaje indica que el email ya está registrado
```

#### Subtasks

**DEV**
- [ ] Implementar `POST /api/v1/auth/register/buyer` — registro público de compradores
- [ ] Validar unicidad de email con constraint de BD
- [ ] Generar JWT con role `BUYER` al registrarse
- [ ] Implementar `POST /api/v1/auth/login` compatible con ambos roles (ADMIN, BUYER)
- [ ] Mantener flujo anónimo: si no hay header `Authorization`, aceptar `buyerEmail` en el body de reserva
- [ ] Si hay JWT con role BUYER, usar `userId` del token como `buyerId` en la reserva
- [ ] Endpoint `GET /api/v1/auth/me` para obtener perfil del usuario autenticado

**QA**
- [ ] Verificar registro de comprador genera JWT con role BUYER
- [ ] Verificar que compra anónima sigue funcionando sin token
- [ ] Verificar que comprador autenticado no necesita email en body
- [ ] Verificar rechazo de email duplicado con 409
- [ ] Verificar que BUYER no puede acceder a endpoints admin

---

### HU-SEC-04: Securización de configuración y credenciales — SP: 3

Como **DevOps**
Quiero que las credenciales de la infraestructura sean seguras y no estén hardcodeadas
Para prevenir accesos no autorizados a bases de datos y servicios de mensajería

**Prioridad:** Crítica

#### Criterios de Aceptación

**CA-01. Credenciales no hardcodeadas**
```gherkin
Escenario: Credenciales configuradas por entorno
  Dado que el sistema se despliega en un ambiente
  Cuando se revisa la configuración
  Entonces las contraseñas de PostgreSQL no son "postgres"
  Y las credenciales de RabbitMQ no son "guest/guest"
  Y el secreto de servicio no contiene "dev-secret"
  Y todas las credenciales provienen de variables de entorno o secrets
```

**CA-02. CORS restringido**
```gherkin
Escenario: CORS configurado para orígenes permitidos
  Dado que el API Gateway tiene configuración CORS
  Cuando se revisa la configuración
  Entonces `allowedOrigins` lista orígenes específicos (no wildcard "*")
  Y `allowedHeaders` lista headers específicos permitidos
```

**CA-03. Swagger deshabilitado en producción**
```gherkin
Escenario: Swagger UI no accesible en producción
  Dado que el sistema se ejecuta con profile "prod"
  Cuando un usuario intenta acceder a "/swagger-ui.html"
  Entonces recibe un error 404
  Y el endpoint "/v3/api-docs" tampoco es accesible
```

**CA-04. Puertos internos no expuestos**
```gherkin
Escenario: Solo el gateway expone puerto al exterior
  Dado que el sistema se ejecuta con Docker Compose de producción
  Cuando se revisan los puertos expuestos
  Entonces solo el puerto del API Gateway (8080) está expuesto al host
  Y los puertos de PostgreSQL y RabbitMQ no tienen binding al host
```

#### Subtasks

**DEV**
- [ ] Crear `.env.example` con valores placeholder (sin credenciales reales)
- [ ] Verificar que `.env` está en `.gitignore`
- [ ] Crear `docker-compose.prod.yml` sin port bindings internos
- [ ] Configurar profiles de Spring: `dev` (Swagger on, CORS permisivo) vs `prod` (Swagger off, CORS restringido)
- [ ] Generar credenciales fuertes aleatorias para `.env` de producción
- [ ] Cambiar `logging.level` a INFO en profile `prod`
- [ ] Documentar proceso de rotación de secretos

**QA**
- [ ] Verificar que `.env` no contiene credenciales por defecto en ambiente de producción
- [ ] Verificar que Swagger no responde en profile `prod`
- [ ] Verificar que CORS rechaza orígenes no listados
- [ ] Verificar que solo el puerto 8080 es accesible externamente

---

## Épica 2: Seguridad Frontend — Login Real y Manejo Seguro de Tokens

### HU-SEC-05: Pantalla de login real para administrador — SP: 5

Como **Administrador**
Quiero una pantalla de login que valide mis credenciales contra el backend
Para no depender de credenciales hardcodeadas en el código fuente del frontend

**Capa:** `frontend`
**Prioridad:** Crítica
**Dependencia:** HU-SEC-01

#### Criterios de Aceptación

**CA-01. Login contra API real**
```gherkin
Escenario: Login exitoso del administrador
  Dado que el administrador está en la página "/admin/login"
  Cuando ingresa email y contraseña válidos
  Y presiona el botón "Iniciar Sesión"
  Entonces el frontend envía las credenciales a "POST /api/v1/auth/login"
  Y almacena el JWT recibido de forma segura
  Y redirige al dashboard de administración "/admin/events"
```

**CA-02. Error de login mostrado al usuario**
```gherkin
Escenario: Credenciales inválidas
  Dado que el administrador está en la página "/admin/login"
  Cuando ingresa credenciales incorrectas
  Entonces muestra un mensaje de error genérico "Credenciales inválidas"
  Y no revela si el error fue en email o contraseña
  Y el campo de contraseña se limpia
```

**CA-03. Eliminación de credenciales hardcodeadas**
```gherkin
Escenario: Sin credenciales en código fuente
  Dado que se revisa el código del frontend
  Cuando se buscan strings como "admin@sem7.com" o "admin123"
  Entonces no existen credenciales hardcodeadas en ningún archivo
```

**CA-04. Token JWT renovado automáticamente**
```gherkin
Escenario: Token próximo a expirar se renueva
  Dado que el administrador está autenticado con un JWT
  Y el token expira en menos de 30 minutos
  Cuando realiza una acción en el panel
  Entonces el frontend solicita un nuevo token automáticamente
  Y actualiza el almacenamiento sin interrumpir la sesión
```

#### Subtasks

**DEV**
- [ ] Refactorizar `AuthContext.tsx` — eliminar `DEMO_EMAIL`, `DEMO_PASSWORD` y validación local
- [ ] Crear `authService.ts` con funciones: `login(email, password)`, `register(email, password)`, `refreshToken()`, `getProfile()`
- [ ] Implementar almacenamiento de JWT en memoria (variable de estado React) con fallback a `sessionStorage` (no `localStorage`)
- [ ] Crear interceptor Axios para inyectar `Authorization: Bearer <token>` en cada request
- [ ] Crear interceptor Axios para detectar 401 y redirigir a login
- [ ] Actualizar componente `AdminLogin` para llamar a `authService.login()`
- [ ] Implementar lógica de refresh token silencioso
- [ ] Actualizar `AdminGuard` para verificar token válido (no solo presencia en storage)

**QA**
- [ ] Verificar login exitoso redirige a dashboard
- [ ] Verificar credenciales inválidas muestran error genérico
- [ ] Verificar que no hay credenciales hardcodeadas en el bundle
- [ ] Verificar que token expirado redirige a login
- [ ] Verificar que `sessionStorage` se limpia al cerrar sesión

---

### HU-SEC-06: Login y registro opcional para compradores en el frontend — SP: 5

Como **Comprador**
Quiero poder crear una cuenta o iniciar sesión opcionalmente desde la aplicación
Para tener un historial de mis compras y completar reservas más rápido

**Capa:** `frontend`
**Prioridad:** Media
**Dependencia:** HU-SEC-03

#### Criterios de Aceptación

**CA-01. Botón de login visible pero no obligatorio**
```gherkin
Escenario: Acceso a login desde la navegación
  Dado que un comprador está navegando la cartelera
  Cuando mira la barra de navegación
  Entonces ve un botón "Iniciar Sesión" / "Registrarse"
  Y puede seguir navegando y comprando sin hacer clic en él
```

**CA-02. Formulario de registro de comprador**
```gherkin
Escenario: Registro de comprador
  Dado que un visitante hace clic en "Registrarse"
  Cuando ingresa email y contraseña (mínimo 8 caracteres, una mayúscula, un número)
  Y confirma la contraseña
  Y presiona "Crear Cuenta"
  Entonces se crea su cuenta vía "POST /api/v1/auth/register/buyer"
  Y queda autenticado automáticamente
  Y se redirige a la página desde la que vino
```

**CA-03. Comprador autenticado ve su email pre-llenado**
```gherkin
Escenario: Email pre-llenado en checkout
  Dado que un comprador está autenticado
  Cuando accede al checkout de un ticket
  Entonces el campo de email aparece pre-llenado con su email de cuenta
  Y no es editable
```

**CA-04. Historial de tickets para compradores autenticados**
```gherkin
Escenario: Acceso a historial de tickets
  Dado que un comprador está autenticado con role BUYER
  Cuando navega a "/mis-tickets"
  Entonces ve los tickets asociados a su cuenta
  Y están ordenados por fecha de compra descendente
```
> **Nota:** La implementación detallada de la vista de tickets se especifica en HU-TKT-01.

#### Subtasks

**DEV**
- [ ] Crear página `/login` para compradores (separada del admin login)
- [ ] Crear página `/registro` con formulario de registro
- [ ] Agregar botón "Iniciar Sesión" / "Registrarse" en `NavBar` (solo si no está autenticado)
- [ ] Mostrar nombre/email del usuario autenticado en `NavBar` con menú desplegable (Cerrar Sesión, Mis Tickets)
- [ ] Pre-llenar email en el checkout si el usuario está autenticado
- [ ] Crear ruta `/mis-tickets` que filtre por userId del comprador autenticado
- [ ] Mantener flujo de compra anónima sin cambios para usuarios no autenticados

**QA**
- [ ] Verificar que compra anónima funciona sin cambios
- [ ] Verificar registro de comprador crea cuenta y autentica
- [ ] Verificar email pre-llenado en checkout para usuario autenticado
- [ ] Verificar que BUYER no puede acceder a /admin/*
- [ ] Verificar historial de tickets muestra solo tickets del comprador

---

### HU-SEC-07: Interceptores Axios centralizados y manejo de errores de seguridad — SP: 3

Como **Desarrollador**
Quiero un interceptor Axios centralizado que maneje JWT, errores 401/403 y CSRF
Para no repetir lógica de autenticación en cada service file

**Capa:** `frontend`
**Prioridad:** Alta
**Dependencia:** HU-SEC-05

#### Criterios de Aceptación

**CA-01. Token JWT inyectado automáticamente**
```gherkin
Escenario: Header Authorization añadido a cada request
  Dado que un usuario está autenticado con un JWT
  Cuando cualquier service file hace un request HTTP
  Entonces el interceptor agrega "Authorization: Bearer <token>" automáticamente
  Y los service files no necesitan manejar el token manualmente
```

**CA-02. Error 401 redirige a login**
```gherkin
Escenario: Token expirado detectado
  Dado que el usuario está autenticado pero su token ha expirado
  Cuando cualquier request retorna 401 Unauthorized
  Entonces el interceptor limpia la sesión
  Y redirige al usuario a la pantalla de login correspondiente (admin o buyer)
  Y muestra un toast "Tu sesión ha expirado"
```

**CA-03. Error 403 muestra mensaje de acceso denegado**
```gherkin
Escenario: Acceso denegado por rol insuficiente
  Dado que un BUYER intenta acceder a un endpoint de ADMIN
  Cuando el request retorna 403 Forbidden
  Entonces muestra un mensaje "No tienes permisos para esta acción"
  Y no redirige a login (el usuario está autenticado, solo no autorizado)
```

#### Subtasks

**DEV**
- [ ] Crear instancia Axios centralizada en `services/apiClient.ts`
- [ ] Implementar request interceptor que inyecta `Authorization: Bearer <token>`
- [ ] Implementar response interceptor para 401 → limpiar sesión + redirect a login
- [ ] Implementar response interceptor para 403 → toast de "Acceso denegado"
- [ ] Refactorizar todos los service files para usar la instancia centralizada
- [ ] Eliminar manejo manual de headers en `adminEventService.ts` y demás

**QA**
- [ ] Verificar que token se envía en todas las requests autenticadas
- [ ] Verificar redirect a login en 401
- [ ] Verificar toast de acceso denegado en 403
- [ ] Verificar que requests públicas no envían token innecesariamente

---

## Épica 3: Mejoras del Panel de Administración

### HU-ADM-01: Edición de eventos existentes — SP: 5

Como **Administrador**
Quiero editar la información de un evento después de haberlo creado
Para corregir errores o actualizar datos sin tener que crear un evento nuevo

**Microservicios:** `ms-events`, `frontend`
**Prioridad:** Alta
**Dependencia:** HU-01

#### Criterios de Aceptación

**CA-01. Edición de evento en estado borrador**
```gherkin
Escenario: Edición completa de evento borrador
  Dado que existe un evento en estado "DRAFT"
  Cuando el administrador modifica cualquier campo (título, descripción, fecha, aforo, sala, imagen, etc.)
  Y envía los cambios
  Entonces el sistema actualiza el evento con los nuevos datos
  Y mantiene el estado "DRAFT"
```

**CA-02. Edición parcial de evento publicado**
```gherkin
Escenario: Edición limitada de evento publicado
  Dado que existe un evento en estado "PUBLISHED"
  Cuando el administrador intenta editar
  Entonces solo puede modificar: descripción, subtítulo, imagen, director, elenco, ubicación
  Y NO puede modificar: título, fecha, aforo, sala (campos estructurales)
  Y el formulario muestra los campos no editables como deshabilitados
```

**CA-03. Validaciones mantenidas al editar**
```gherkin
Escenario: Validación de aforo al editar
  Dado que un evento en borrador tiene tiers configurados con cupos que suman 80
  Cuando el administrador intenta cambiar el aforo a 50
  Entonces el sistema rechaza el cambio porque los cupos existentes (80) superan el nuevo aforo (50)
```

#### Subtasks

**DEV Backend**
- [ ] Implementar `PUT /api/v1/events/{id}` con validaciones según estado
- [ ] Validar que el aforo editado no sea menor a la suma de cupos de tiers existentes
- [ ] Validar campos inmutables para eventos publicados
- [ ] Actualizar `updated_at` al editar

**DEV Frontend**
- [ ] Reutilizar `EventForm` en modo edición (cargar datos existentes)
- [ ] Agregar botón "Editar" en `EventDetailAdmin`
- [ ] Deshabilitar campos no editables según estado del evento
- [ ] Crear ruta `/admin/events/:id/edit`

**QA**
- [ ] Verificar edición completa en borrador
- [ ] Verificar edición limitada en publicado
- [ ] Verificar validación de aforo contra tiers existentes
- [ ] Verificar que campos inmutables no se pueden modificar en publicado

---

### HU-ADM-02: Cancelación de eventos — SP: 3

Como **Administrador**
Quiero poder cancelar un evento publicado
Para manejar situaciones donde un evento no puede realizarse

**Microservicios:** `ms-events`, `ms-ticketing`, `frontend`
**Prioridad:** Alta

#### Criterios de Aceptación

**CA-01. Cancelación de evento con confirmación**
```gherkin
Escenario: Cancelación exitosa
  Dado que existe un evento en estado "PUBLISHED"
  Cuando el administrador hace clic en "Cancelar Evento"
  Entonces aparece un modal de confirmación solicitando motivo de cancelación
  Y al confirmar, el sistema cambia el estado del evento a "CANCELLED"
  Y el evento ya no aparece en la cartelera pública
```

**CA-02. Notificación a compradores con reservas activas**
```gherkin
Escenario: Compradores notificados de cancelación
  Dado que un evento cancelado tiene reservas activas o tickets vendidos
  Cuando el evento se cancela
  Entonces el sistema publica un evento RabbitMQ "event.cancelled"
  Y ms-notifications envía notificación a todos los compradores afectados
```

**CA-03. Reservas activas expiradas automáticamente**
```gherkin
Escenario: Reservas del evento cancelado se liberan
  Dado que un evento cancelado tiene reservas en estado "PENDING"
  Cuando el evento se cancela
  Entonces todas las reservas pendientes pasan a estado "EXPIRED"
  Y los cupos se liberan
```

#### Subtasks

**DEV Backend**
- [ ] Implementar `PATCH /api/v1/events/{id}/cancel` con campo `cancellationReason`
- [ ] Validar que solo eventos PUBLISHED pueden cancelarse
- [ ] Publicar evento RabbitMQ `event.cancelled` con eventId y motivo
- [ ] En ms-ticketing: listener que expire reservas PENDING del evento cancelado
- [ ] En ms-notifications: listener que envíe notificaciones de cancelación

**DEV Frontend**
- [ ] Agregar botón "Cancelar Evento" en `EventDetailAdmin` (solo para PUBLISHED)
- [ ] Crear modal de confirmación con campo de motivo obligatorio
- [ ] Mostrar estado CANCELLED con badge rojo en dashboard

**QA**
- [ ] Verificar cancelación cambia estado a CANCELLED
- [ ] Verificar que reservas pendientes se expiran
- [ ] Verificar notificación enviada a compradores
- [ ] Verificar que evento cancelado no aparece en cartelera pública

---

### HU-ADM-03: Dashboard con métricas y analítica básica — SP: 5

Como **Administrador**
Quiero ver métricas clave sobre mis eventos en el dashboard
Para tomar decisiones informadas sobre la gestión de eventos

**Microservicios:** `ms-events`, `ms-ticketing`, `frontend`
**Prioridad:** Media

#### Criterios de Aceptación

**CA-01. Tarjetas de resumen en el dashboard**
```gherkin
Escenario: Vista de métricas generales
  Dado que el administrador está en el dashboard "/admin/events"
  Cuando la página carga
  Entonces muestra tarjetas con:
    | Métrica                  | Descripción                        |
    | Total Eventos            | Cantidad total de eventos           |
    | Eventos Publicados       | Cantidad de eventos activos         |
    | Tickets Vendidos (total) | Suma de tickets confirmados         |
    | Reservas Activas         | Reservas pendientes de pago         |
```

**CA-02. Métricas por evento en la tabla**
```gherkin
Escenario: Columnas de métricas en la tabla de eventos
  Dado que el administrador ve la tabla de eventos
  Cuando revisa las columnas
  Entonces cada evento muestra:
    - Tickets vendidos / Aforo total (con barra de progreso)
    - Reservas activas
    - Ingresos estimados (suma de pagos confirmados)
```

**CA-03. Búsqueda y paginación**
```gherkin
Escenario: Filtrado y paginación
  Dado que existen más de 10 eventos
  Cuando el administrador usa la barra de búsqueda
  Entonces puede filtrar por título del evento
  Y la tabla muestra paginación con 10 eventos por página
```

#### Subtasks

**DEV Backend**
- [ ] Implementar `GET /api/v1/events/admin/stats` que retorne métricas agregadas
- [ ] Agregar campo `ticketsSold` y `activeReservations` al response de listado admin
- [ ] Implementar búsqueda por título: `GET /api/v1/events/admin?search=<query>`
- [ ] Implementar paginación: `?page=0&size=10`

**DEV Frontend**
- [ ] Crear componente `StatsCards` con las 4 tarjetas de resumen
- [ ] Agregar columnas de métricas a la tabla de eventos
- [ ] Implementar barra de búsqueda con debounce (300ms)
- [ ] Implementar paginación con controles prev/next y selector de página
- [ ] Agregar barra de progreso inline para "vendidos / aforo"

**QA**
- [ ] Verificar que las 4 tarjetas muestran datos correctos
- [ ] Verificar que métricas por evento coinciden con datos reales
- [ ] Verificar búsqueda filtra por título correctamente
- [ ] Verificar paginación funciona con más de 10 eventos

---

### HU-ADM-04: Gestión de salas (CRUD) — SP: 5

Como **Administrador**
Quiero gestionar las salas del sistema (crear, editar, ver, eliminar)
Para mantener actualizado el catálogo de espacios disponibles para eventos

**Microservicio:** `ms-events`, `frontend`
**Prioridad:** Media

#### Criterios de Aceptación

**CA-01. Listado de salas**
```gherkin
Escenario: Ver todas las salas
  Dado que el administrador navega a "/admin/rooms"
  Cuando la página carga
  Entonces muestra una tabla con todas las salas
  Y cada fila muestra: nombre, capacidad máxima, cantidad de eventos asociados
```

**CA-02. Creación de sala**
```gherkin
Escenario: Crear nueva sala
  Dado que el administrador está en "/admin/rooms"
  Cuando hace clic en "Crear Sala"
  Y llena el formulario con nombre y capacidad máxima
  Entonces el sistema crea la sala
  Y aparece en la tabla
```

**CA-03. Edición de sala**
```gherkin
Escenario: Editar sala existente
  Dado que existe una sala "Sala Principal" con capacidad 500
  Cuando el administrador edita la capacidad a 600
  Entonces el sistema actualiza la sala
  Y los eventos futuros pueden usar la nueva capacidad
```

**CA-04. Eliminación segura de sala**
```gherkin
Escenario: Sala con eventos asociados no se puede eliminar
  Dado que existe una sala con eventos en estado DRAFT o PUBLISHED
  Cuando el administrador intenta eliminar la sala
  Entonces el sistema rechaza la eliminación
  Y muestra un mensaje indicando los eventos asociados
```

#### Subtasks

**DEV Backend**
- [ ] Implementar `GET /api/v1/rooms` (listado con conteo de eventos)
- [ ] Implementar `POST /api/v1/rooms` (creación)
- [ ] Implementar `PUT /api/v1/rooms/{id}` (edición)
- [ ] Implementar `DELETE /api/v1/rooms/{id}` (eliminación con validación de eventos asociados)
- [ ] Proteger todos los endpoints con role ADMIN

**DEV Frontend**
- [ ] Crear página `/admin/rooms` con tabla de salas
- [ ] Crear formulario de creación/edición de salas (reutilizable)
- [ ] Agregar link "Salas" en la navegación del admin
- [ ] Implementar acción de eliminar con confirmación

**QA**
- [ ] Verificar CRUD completo de salas
- [ ] Verificar que sala con eventos no se puede eliminar
- [ ] Verificar que nueva sala aparece en selector al crear evento

---

### HU-ADM-05: Navegación mejorada del panel de administración — SP: 3

Como **Administrador**
Quiero una navegación más completa y organizada en el panel de administración
Para acceder rápidamente a todas las funcionalidades de gestión

**Capa:** `frontend`
**Prioridad:** Media

#### Criterios de Aceptación

**CA-01. Sidebar de navegación**
```gherkin
Escenario: Sidebar con secciones del panel
  Dado que el administrador está en el panel de administración
  Cuando ve la interfaz
  Entonces existe un sidebar (lateral izquierdo) con las secciones:
    | Sección       | Ruta                | Ícono     |
    | Dashboard     | /admin/events       | 📊        |
    | Eventos       | /admin/events       | 🎭        |
    | Salas         | /admin/rooms        | 🏛️        |
  Y la sección activa está resaltada visualmente
  Y el sidebar es colapsable en pantallas pequeñas
```

**CA-02. Header mejorado con información contextual**
```gherkin
Escenario: Header con datos del administrador
  Dado que el administrador está autenticado
  Cuando ve el header del panel
  Entonces muestra: nombre/email del admin, botón de notificaciones (futuro), botón de cerrar sesión
  Y no muestra credenciales en texto plano
```

**CA-03. Vista de detalle con tabs**
```gherkin
Escenario: Detalle de evento con tabs organizados
  Dado que el administrador está en el detalle de un evento
  Cuando ve la interfaz
  Entonces la información está organizada en tabs:
    | Tab          | Contenido                              |
    | Información  | Datos generales del evento             |
    | Tiers        | Configuración de tiers y precios       |
    | Reservas     | Lista de reservas activas del evento   |
    | Métricas     | Tickets vendidos, ingresos, ocupación  |
```

#### Subtasks

**DEV Frontend**
- [ ] Crear componente `AdminSidebar` con navegación por secciones
- [ ] Reemplazar `AdminNavBar` fijo por layout sidebar + topbar
- [ ] Hacer sidebar responsive (colapsable en mobile)
- [ ] Crear sistema de tabs para `EventDetailAdmin`
- [ ] Agregar tab "Reservas" que liste reservas del evento
- [ ] Agregar tab "Métricas" con datos de venta del evento
- [ ] Mejorar topbar con avatar, nombre y menú desplegable de usuario

**QA**
- [ ] Verificar navegación entre secciones del sidebar
- [ ] Verificar que sección activa se resalta
- [ ] Verificar tabs en detalle de evento cargan correctamente
- [ ] Verificar diseño responsive en mobile

---

## Épica 4: Hardening y Protecciones Adicionales

### HU-SEC-08: Headers de seguridad HTTP y protección contra ataques comunes — SP: 3

Como **Sistema**
Quiero que todas las respuestas HTTP incluyan headers de seguridad estándar
Para proteger contra XSS, clickjacking, MIME sniffing y otros ataques comunes

**Microservicio:** `api-gateway`
**Prioridad:** Alta

#### Criterios de Aceptación

**CA-01. Headers de seguridad en todas las respuestas**
```gherkin
Escenario: Headers de seguridad presentes
  Dado que un cliente hace cualquier request al API Gateway
  Cuando recibe la respuesta
  Entonces incluye los headers:
    | Header                    | Valor                                      |
    | X-Content-Type-Options    | nosniff                                    |
    | X-Frame-Options           | DENY                                       |
    | X-XSS-Protection          | 0                                          |
    | Strict-Transport-Security | max-age=31536000; includeSubDomains        |
    | Content-Security-Policy   | default-src 'self'; script-src 'self'      |
    | Referrer-Policy           | strict-origin-when-cross-origin            |
    | Permissions-Policy        | camera=(), microphone=(), geolocation=()   |
```

**CA-02. Respuestas de error no revelan stack traces**
```gherkin
Escenario: Error 500 sin información interna
  Dado que ocurre un error inesperado en un microservicio
  Cuando el cliente recibe la respuesta de error
  Entonces el body contiene un mensaje genérico "Error interno del servidor"
  Y no incluye stack trace, nombre de clases Java, ni rutas de archivos
```

#### Subtasks

**DEV**
- [ ] Implementar `SecurityHeadersFilter` global en api-gateway
- [ ] Configurar Spring Security headers (si se usa con HU-SEC-01)
- [ ] Revisar y sanitizar mensajes de error en `GlobalExceptionHandler` de cada microservicio
- [ ] Asegurar que errores 500 retornan mensaje genérico sin detalles internos

**QA**
- [ ] Verificar presencia de todos los headers de seguridad en responses
- [ ] Verificar que errores 500 no revelan stack traces
- [ ] Verificar que errores de validación no revelan estructura interna

---

## Épica 5: Funcionalidades de Tickets y Perfil de Usuario

### HU-TKT-01: Vista real de tickets del usuario autenticado — SP: 5

Como **Comprador autenticado**
Quiero ver mis tickets confirmados en una sección dedicada
Para tener acceso a todas mis compras desde mi cuenta

**Microservicios:** `ms-ticketing`, `api-gateway`, `frontend`
**Prioridad:** Alta
**Dependencia:** HU-SEC-01, HU-SEC-02, HU-04
**Justificación SP:** Requiere endpoint backend con enriquecimiento cross-service (ms-ticketing → ms-events), protección por JWT, reemplazo de lógica mock/localStorage en frontend, y paginación.

> **Relación con HU-SEC-06:** La HU-SEC-06 introduce la ruta `/mis-tickets` como parte del login de compradores. Esta HU detalla la implementación completa de esa vista con datos reales.

#### Criterios de Aceptación

**CA-01. Lista real de tickets del usuario autenticado**
```gherkin
Escenario: Comprador autenticado consulta sus tickets
  Dado que el comprador está autenticado con JWT válido (role BUYER)
  Cuando navega a "/mis-tickets"
  Entonces el sistema consulta GET /api/v1/tickets?buyerId={userId}
  Y muestra los tickets reales confirmados asociados a su cuenta
  Y NO usa localStorage ni datos mock
  Y cada ticket muestra: evento, fecha, tier, precio pagado y estado
  Y están ordenados por fecha de compra descendente
```

**CA-02. Estado vacío cuando no hay tickets**
```gherkin
Escenario: Comprador sin tickets aún
  Dado que el comprador está autenticado pero no ha comprado entradas
  Cuando navega a "/mis-tickets"
  Entonces ve un mensaje "Aún no tienes tickets"
  Y un botón "Ver cartelera" que lo lleva a /events
```

**CA-03. Ticket muestra información completa del evento**
```gherkin
Escenario: Detalle de ticket en la lista
  Dado que el comprador tiene tickets confirmados
  Cuando ve la lista de sus tickets
  Entonces cada ticket muestra:
    | Campo         | Descripción                  |
    | Evento        | Título del evento            |
    | Fecha         | Fecha y hora del evento      |
    | Tier          | Tipo de entrada (VIP, etc.)  |
    | Precio        | Precio pagado                |
    | Estado        | VALID o CANCELLED            |
    | Fecha compra  | Cuándo se compró             |
```

#### Subtasks

**DEV Backend**
- [ ] Implementar `GET /api/v1/tickets?buyerId={userId}` en ms-ticketing
- [ ] Proteger endpoint — solo el propio usuario o ADMIN puede consultar
- [ ] Enriquecer response con datos del evento (nombre, fecha) vía llamada a ms-events o cache
- [ ] Agregar paginación: `?page=0&size=10`

**DEV Frontend**
- [ ] Reemplazar lógica de localStorage en vista de tickets por llamada real a la API
- [ ] Crear hook `useMyTickets` que consuma el endpoint real
- [ ] Mostrar estado vacío si no hay tickets
- [ ] Limpiar cualquier código mock o datos hardcodeados de la vista

**QA**
- [ ] Verificar que la vista muestra tickets reales del usuario
- [ ] Verificar que no hay datos mock ni localStorage en el flujo
- [ ] Verificar que un usuario no puede ver tickets de otro usuario
- [ ] Verificar estado vacío se muestra correctamente

---

### HU-TKT-02: Asociación de tickets anónimos al registrarse — SP: 5

Como **Comprador**
Quiero que al crear mi cuenta con el mismo email con el que compré tickets de forma anónima, esos tickets queden asociados a mi nueva cuenta
Para no perder el historial de compras realizadas antes de registrarme

**Microservicios:** `api-gateway`, `ms-ticketing`
**Prioridad:** Media
**Dependencia:** HU-SEC-03, HU-TKT-01
**Justificación SP:** Requiere coordinación entre api-gateway (registro) y ms-ticketing (asociación), migración condicional de campo `buyer_email`, y lógica idempotente para evitar duplicación.

#### Criterios de Aceptación

**CA-01. Tickets anónimos asociados al registrarse**
```gherkin
Escenario: Registro con email que tiene compras previas
  Dado que existe un ticket confirmado con buyer_email "juan@email.com"
    Y el ticket fue comprado de forma anónima (sin cuenta)
  Cuando Juan se registra con el email "juan@email.com"
  Entonces el sistema busca tickets con buyer_email = "juan@email.com"
  Y asocia esos tickets al nuevo userId de Juan
  Y los tickets aparecen en su sección "/mis-tickets"
```

**CA-02. Registro sin compras previas no falla**
```gherkin
Escenario: Registro con email sin compras previas
  Dado que no existe ningún ticket con el email de registro
  Cuando el usuario se registra
  Entonces el registro es exitoso sin errores
  Y la sección "/mis-tickets" aparece vacía
```

**CA-03. La asociación no duplica tickets**
```gherkin
Escenario: Registro cuando ya existe asociación parcial
  Dado que el usuario ya tiene algunos tickets asociados a su cuenta
    Y tiene otros tickets anónimos con el mismo email
  Cuando el sistema ejecuta la asociación
  Entonces solo asocia los tickets que aún no tienen userId asignado
  Y no duplica tickets ya asociados
```

#### Subtasks

**DEV Backend**
- [ ] Asegurar que `buyer_email` se guarda en la tabla `ticket` al crear compra anónima (verificar existencia o agregar campo con migración Flyway)
- [ ] Implementar método en `TicketService`: `associateAnonymousTickets(userId, email)`
- [ ] Llamar este método desde el flujo de registro de comprador en api-gateway (post-registro vía evento RabbitMQ `user.registered` o llamada síncrona)
- [ ] Hacer la asociación idempotente: solo actualizar tickets donde `user_id IS NULL AND buyer_email = :email`

**QA**
- [ ] Verificar asociación correcta de tickets anónimos al registrarse
- [ ] Verificar que registro sin compras previas no lanza errores
- [ ] Verificar que no se duplican tickets ya asociados
- [ ] Verificar que los tickets asociados aparecen en "/mis-tickets"

---

### HU-TKT-03: Descarga de ticket en PDF — SP: 3

Como **Comprador**
Quiero descargar mi ticket confirmado como archivo PDF
Para tener una copia física o digital de mi entrada al evento

**Microservicios:** `ms-ticketing`, `frontend`
**Prioridad:** Alta
**Dependencia:** HU-04, HU-TKT-01
**Justificación SP:** Generación de PDF es self-contained con iText/PDFBox, el endpoint es simple y la descarga en frontend es estándar con Blob.

#### Criterios de Aceptación

**CA-01. Botón de descarga funcional en vista de detalle**
```gherkin
Escenario: Descarga desde detalle del ticket
  Dado que el comprador tiene un ticket confirmado
  Cuando hace clic en el botón "Descargar Ticket"
  Entonces el sistema genera un PDF con la información del ticket
  Y el archivo se descarga automáticamente con nombre:
    "ticket-{ticketId}.pdf"
```

**CA-02. Descarga desde la lista de tickets**
```gherkin
Escenario: Descarga desde la lista de mis tickets
  Dado que el comprador está en "/mis-tickets"
  Cuando hace clic en el ícono de descarga de un ticket
  Entonces descarga el PDF de ese ticket específico
```

**CA-03. Contenido del PDF**
```gherkin
Escenario: Información completa en el PDF
  Dado que se descarga un ticket
  Cuando el comprador abre el archivo PDF
  Entonces contiene:
    | Campo         | Descripción                        |
    | Título        | Nombre del evento                  |
    | Fecha         | Fecha y hora del evento            |
    | Sala          | Nombre de la sala                  |
    | Tier          | Tipo de entrada                    |
    | Precio        | Precio pagado                      |
    | ID del ticket | UUID del ticket como referencia    |
    | Nombre        | Email/nombre del comprador         |
```

**CA-04. Solo tickets VALID pueden descargarse**
```gherkin
Escenario: Ticket cancelado no se puede descargar
  Dado que un ticket tiene estado CANCELLED
  Cuando el comprador intenta descargarlo
  Entonces el botón de descarga está deshabilitado
  Y muestra el mensaje "Este ticket fue cancelado"
```

#### Subtasks

**DEV Backend**
- [ ] Agregar dependencia `itext-core` o `pdfbox` en `ms-ticketing/build.gradle`
- [ ] Implementar `GET /api/v1/tickets/{ticketId}/pdf` en ms-ticketing
- [ ] Generar PDF con datos del ticket + datos del evento (vía llamada a ms-events)
- [ ] Retornar con headers `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="ticket-{id}.pdf"`
- [ ] Proteger endpoint — solo el propietario del ticket o ADMIN puede descargar
- [ ] Validar que el ticket esté en estado VALID antes de generar

**DEV Frontend**
- [ ] Hacer funcional el botón "Descargar Ticket" existente en la vista de detalle
- [ ] Agregar ícono de descarga en cada ticket de la lista "/mis-tickets"
- [ ] Deshabilitar botón de descarga para tickets CANCELLED
- [ ] Manejar el blob de respuesta del PDF correctamente para forzar descarga en el navegador

**QA**
- [ ] Verificar que el PDF se genera y descarga correctamente
- [ ] Verificar que el PDF contiene toda la información del ticket
- [ ] Verificar que ticket CANCELLED no puede descargarse
- [ ] Verificar que solo el propietario puede descargar su ticket

---

### HU-USR-01: Perfil básico del usuario — SP: 2

Como **Usuario autenticado (ADMIN o BUYER)**
Quiero acceder a una página de perfil mínima
Para actualizar mi contraseña y verificar el email de mi cuenta

**Microservicio:** `api-gateway`, `frontend`
**Prioridad:** Baja
**Dependencia:** HU-SEC-01
**Justificación SP:** El endpoint `GET /api/v1/auth/me` ya está previsto en HU-SEC-03. Solo requiere el endpoint de cambio de contraseña y una página frontend simple.

#### Criterios de Aceptación

**CA-01. Vista de perfil con datos básicos**
```gherkin
Escenario: Usuario ve su perfil
  Dado que el usuario está autenticado
  Cuando navega a "/perfil"
  Entonces ve su email (no editable)
  Y ve su rol (ADMIN o BUYER, no editable)
  Y un formulario para cambiar contraseña
```

**CA-02. Cambio de contraseña exitoso**
```gherkin
Escenario: Cambio de contraseña
  Dado que el usuario está en "/perfil"
  Cuando ingresa su contraseña actual, la nueva contraseña
    y la confirmación de la nueva contraseña
  Y la nueva contraseña cumple: mínimo 8 caracteres, una mayúscula, un número
  Entonces el sistema actualiza la contraseña con BCrypt
  Y muestra un mensaje "Contraseña actualizada exitosamente"
  Y cierra la sesión para que el usuario vuelva a autenticarse
```

**CA-03. Contraseña actual incorrecta es rechazada**
```gherkin
Escenario: Contraseña actual incorrecta
  Dado que el usuario está en "/perfil"
  Cuando ingresa una contraseña actual incorrecta
  Entonces el sistema retorna 400 Bad Request
  Y muestra "La contraseña actual es incorrecta"
  Y no actualiza la contraseña
```

#### Subtasks

**DEV Backend**
- [ ] Verificar que `GET /api/v1/auth/me` (previsto en HU-SEC-03) retorna email y role del usuario autenticado
- [ ] Implementar `PATCH /api/v1/auth/me/password` — cambia contraseña validando la contraseña actual antes de actualizar
- [ ] Validar requisitos de complejidad de la nueva contraseña (min 8, 1 mayúscula, 1 número)
- [ ] Invalidar token actual tras cambio de contraseña (o retornar nuevo token)

**DEV Frontend**
- [ ] Crear página `/perfil` con email (solo lectura), rol (solo lectura) y formulario de cambio de contraseña
- [ ] Agregar link "Mi Perfil" en el menú desplegable del usuario (tanto en navbar de comprador como en sidebar de admin)
- [ ] Al cambiar contraseña exitosamente, cerrar sesión y redirigir a login

**QA**
- [ ] Verificar que email y rol no son editables
- [ ] Verificar cambio de contraseña exitoso y cierre de sesión
- [ ] Verificar rechazo de contraseña actual incorrecta
- [ ] Verificar que la nueva contraseña cumple los requisitos mínimos

---

## Resumen de Historias

| ID | Historia | SP | Épica | Prioridad | Dependencia |
|----|----------|-----|-------|-----------|-------------|
| HU-SEC-01 | Registro y login de administrador con JWT | 8 | Seguridad Backend | Crítica | — |
| HU-SEC-02 | Validación JWT en Gateway y propagación segura | 8 | Seguridad Backend | Crítica | HU-SEC-01 |
| HU-SEC-03 | Registro y login opcional de comprador | 5 | Seguridad Backend | Media | HU-SEC-01 |
| HU-SEC-04 | Securización de configuración y credenciales | 3 | Seguridad Backend | Crítica | — |
| HU-SEC-05 | Pantalla login real para administrador | 5 | Seguridad Frontend | Crítica | HU-SEC-01 |
| HU-SEC-06 | Login y registro opcional para compradores FE | 5 | Seguridad Frontend | Media | HU-SEC-03 |
| HU-SEC-07 | Interceptores Axios centralizados | 3 | Seguridad Frontend | Alta | HU-SEC-05 |
| HU-ADM-01 | Edición de eventos existentes | 5 | Admin Panel | Alta | HU-01 |
| HU-ADM-02 | Cancelación de eventos | 3 | Admin Panel | Alta | — |
| HU-ADM-03 | Dashboard con métricas y analítica | 5 | Admin Panel | Media | — |
| HU-ADM-04 | Gestión de salas (CRUD) | 5 | Admin Panel | Media | — |
| HU-ADM-05 | Navegación mejorada del panel admin | 3 | Admin Panel | Media | — |
| HU-SEC-08 | Headers de seguridad y hardening | 3 | Hardening | Alta | — |
| HU-TKT-01 | Vista real de tickets del usuario autenticado | 5 | Tickets y Perfil | Alta | HU-SEC-01, HU-SEC-02, HU-04 |
| HU-TKT-02 | Asociación de tickets anónimos al registrarse | 5 | Tickets y Perfil | Media | HU-SEC-03, HU-TKT-01 |
| HU-TKT-03 | Descarga de ticket en PDF | 3 | Tickets y Perfil | Alta | HU-04, HU-TKT-01 |
| HU-USR-01 | Perfil básico del usuario | 2 | Tickets y Perfil | Baja | HU-SEC-01 |

**Total Story Points:** 76 SP

## Orden de Desarrollo Sugerido

### Sprint 1 — Cimientos de Seguridad (24 SP)
1. **HU-SEC-04** (3 SP) — Securizar credenciales y configuración (no requiere código nuevo, solo config)
2. **HU-SEC-01** (8 SP) — Login backend JWT (base de todo)
3. **HU-SEC-02** (8 SP) — Validación JWT en Gateway (cierra la superficie de ataque)
4. **HU-SEC-05** (5 SP) — Login real en frontend (elimina credenciales hardcodeadas)

### Sprint 2 — Mejoras Admin + Compradores (21 SP)
5. **HU-SEC-07** (3 SP) — Interceptores Axios (facilita todo lo demás)
6. **HU-ADM-01** (5 SP) — Edición de eventos
7. **HU-ADM-02** (3 SP) — Cancelación de eventos
8. **HU-SEC-03** (5 SP) — Login opcional backend compradores
9. **HU-SEC-06** (5 SP) — Login/registro frontend compradores

### Sprint 3 — Tickets, Panel Completo + Hardening (31 SP)
10. **HU-TKT-01** (5 SP) — Vista real de tickets del comprador (requiere SEC-01, SEC-02)
11. **HU-TKT-03** (3 SP) — Descarga de ticket en PDF
12. **HU-TKT-02** (5 SP) — Asociación de tickets anónimos al registrarse (requiere SEC-03)
13. **HU-ADM-03** (5 SP) — Dashboard con métricas
14. **HU-ADM-04** (5 SP) — CRUD de salas
15. **HU-ADM-05** (3 SP) — Navegación mejorada
16. **HU-SEC-08** (3 SP) — Headers de seguridad y hardening
17. **HU-USR-01** (2 SP) — Perfil básico del usuario

---

## Hallazgos de la Auditoría de Seguridad (Referencia)

### Vulnerabilidades Críticas Detectadas

| # | Vulnerabilidad | Ubicación | Historia que lo resuelve |
|---|---------------|-----------|--------------------------|
| 1 | Sin framework de autenticación | Todos los microservicios | HU-SEC-01, HU-SEC-02 |
| 2 | Credenciales hardcodeadas en frontend | `AuthContext.tsx` | HU-SEC-05 |
| 3 | Headers `X-Role` falsificables | `HeaderPropagationFilterConfig.java` | HU-SEC-02 |
| 4 | CORS wildcard `*` | `api-gateway/application.yml` | HU-SEC-04 |
| 5 | Credenciales por defecto (`postgres/postgres`, `guest/guest`) | `.env`, `docker-compose.yml` | HU-SEC-04 |
| 6 | Swagger UI expuesto sin protección | Todos los microservicios | HU-SEC-04 |
| 7 | Puertos de BD expuestos al host | `docker-compose.yml` | HU-SEC-04 |
| 8 | Secreto inter-servicio en texto plano | `application.properties` | HU-SEC-02 |
| 9 | Sin headers de seguridad HTTP | `api-gateway` | HU-SEC-08 |
| 10 | Stack traces en respuestas de error | `GlobalExceptionHandler` | HU-SEC-08 |
| 11 | Logging en nivel DEBUG con SQL | `application.properties` | HU-SEC-04 |
| 12 | Sin CSRF protection | Frontend completo | HU-SEC-07 |

---

## Anexo: Guía de Diseño UI — Login y Dashboard

Referencia visual para la implementación del frontend. Este código es una **guía de diseño**, no código de producción. Los implementadores deben adaptar los componentes al stack real del proyecto (CSS Modules, servicios reales, contextos de autenticación).

**Historias relacionadas:** HU-SEC-05 (Login admin), HU-SEC-06 (Login/registro comprador), HU-ADM-05 (Navegación mejorada con sidebar)

### Decisiones de diseño extraídas

| Elemento | Decisión | Aplica a |
|----------|----------|----------|
| **Login Screen** | Card centrada con glassmorphism (`noir-glass`), fondo con imagen de teatro, animación de entrada con `framer-motion` | HU-SEC-05, HU-SEC-06 |
| **Campos de formulario** | Label uppercase 10px con tracking, ícono a la izquierda, border-bottom animado al focus | HU-SEC-05, HU-SEC-06 |
| **Botones** | Variantes `primary` (gradiente noir), `secondary` (borde sutil), `ghost`. Uppercase, tracking-widest, scale en hover/active | Global |
| **Sidebar** | Fijo a la izquierda, 80px colapsado / 264px expandido, logo + nav + logout al fondo. Responsive | HU-ADM-05 |
| **Header Dashboard** | Sticky top con blur, barra de búsqueda pill, campana de notificaciones con badge, avatar circular | HU-ADM-05, HU-ADM-03 |
| **Event Cards** | 500px alto, imagen cover con grayscale→color en hover, gradiente inferior, botón CTA reveal en hover | Cartelera existente |
| **Transiciones** | `AnimatePresence` con fade entre login↔dashboard. Cards con `whileHover={{ y: -10 }}` | Global |
| **Tipografía** | `font-black` para títulos, `tracking-tighter` para marca, `uppercase tracking-widest` para labels/nav | Global |
| **Color tokens** | `surface`, `surface-container-low`, `on-surface`, `on-surface-variant`, `primary`, `outline-variant` (Material Design 3) | Global |

### Componentes de referencia

#### LoginScreen — Pantalla de autenticación

```tsx
/**
 * GUÍA DE DISEÑO — No es código de producción.
 * Adaptar a: CSS Modules, authService real, AuthContext, validación de formulario.
 * Eliminar: Login social (Google/Apple) si no está en scope.
 * Agregar: Mensajes de error, loading state, validación client-side.
 */

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background: imagen de teatro con opacidad baja + efecto spotlight */}
      <div className="absolute inset-0 spotlight pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&q=80&w=2000"
          alt="Theater Background"
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="noir-glass rounded-2xl px-8 py-12 shadow-2xl">
          {/* Logo: marca SEM7 en bold italic */}
          <div className="flex flex-col items-center mb-10">
            <span className="text-4xl font-black tracking-tighter text-on-surface uppercase italic">
              SEM7
            </span>
            <h1 className="text-3xl font-bold text-on-surface tracking-tight">Inicia Sesión</h1>
            <p className="text-on-surface-variant text-sm mt-2 font-medium">
              Bienvenido a Teatro Noir
            </p>
          </div>

          {/* Formulario: email + contraseña con íconos */}
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <InputField
              label="Correo Electrónico"
              type="email"
              placeholder="tu@correo.com"
              icon={Mail}
            />
            <InputField
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              rightElement={
                <a href="#" className="text-[10px] uppercase tracking-wider text-primary hover:underline font-bold">
                  Olvidé mi contraseña
                </a>
              }
            />
            <Button type="submit" className="w-full mt-4">Entrar</Button>
          </form>

          {/* Separador + login social (opcional / futuro) */}
          <div className="relative my-10 flex items-center">
            <div className="flex-grow border-t border-outline-variant/10"></div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant/30">
              O entrar con
            </span>
            <div className="flex-grow border-t border-outline-variant/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary">Google</Button>
            <Button variant="secondary">Apple</Button>
          </div>

          {/* Link a registro */}
          <div className="mt-12 text-center">
            <p className="text-on-surface-variant text-xs font-medium">
              ¿No tienes cuenta?
              <a href="#" className="text-on-surface font-black hover:text-primary ml-2 uppercase tracking-tighter">
                Regístrate
              </a>
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
};
```

#### DashboardScreen — Layout con sidebar y header

```tsx
/**
 * GUÍA DE DISEÑO — No es código de producción.
 * Adaptar a: AdminSidebar component, rutas reales, datos de API.
 * El sidebar, header y layout de contenido aplican a todo el panel admin.
 */

const DashboardScreen = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {/* Sidebar: fijo izquierda, colapsable en mobile */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-surface border-r border-outline-variant/10 flex flex-col z-30">
        {/* Logo */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black italic">
            S7
          </div>
          <span className="hidden md:block text-xl font-black tracking-tighter uppercase italic">
            Teatro Noir
          </span>
        </div>

        {/* Navegación: ícono + label, item activo con bg-primary/10 */}
        <nav className="flex-grow px-4 space-y-2 mt-8">
          {[
            { icon: Ticket, label: 'Funciones', active: true },
            { icon: Calendar, label: 'Calendario' },
            { icon: User, label: 'Mi Perfil' },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                item.active
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <item.icon size={20} />
              <span className="hidden md:block font-bold text-sm uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Logout al fondo del sidebar */}
        <div className="p-4 mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-4 rounded-xl text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={20} />
            <span className="hidden md:block font-bold text-sm uppercase tracking-widest">
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Contenido principal con offset del sidebar */}
      <main className="pl-20 md:pl-64 min-h-screen">
        {/* Header sticky: búsqueda + notificaciones + avatar */}
        <header className="h-24 border-b border-outline-variant/10 flex items-center justify-between px-8 sticky top-0 bg-surface-container-lowest/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-4 bg-surface-container rounded-full px-6 py-2 w-full max-w-md">
            <Search size={18} className="text-on-surface-variant/40" />
            <input type="text" placeholder="Buscar funciones..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-on-surface-variant hover:text-on-surface">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest border overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Noir" alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Área de contenido: título + grid de cards */}
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
          <h2 className="text-4xl font-black tracking-tight mb-2">Cartelera</h2>
          <p className="text-on-surface-variant">Explora las próximas funciones exclusivas.</p>
          {/* ... Event cards grid ... */}
        </div>
      </main>
    </div>
  );
};
```

#### Componentes reutilizables

```tsx
/** InputField: campo con label superior, ícono izquierdo, elemento derecho opcional */
const InputField = ({ label, type, placeholder, icon: Icon, rightElement }: {
  label: string;
  type: string;
  placeholder: string;
  icon?: React.ComponentType<{ size: number }>;
  rightElement?: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant/70">
        {label}
      </label>
      {rightElement}
    </div>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary transition-colors">
        {Icon && <Icon size={18} />}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary text-on-surface rounded-t-lg p-4 ${Icon ? 'pl-12' : ''} transition-all outline-none placeholder:text-on-surface-variant/20`}
      />
    </div>
  </div>
);

/** Button: 3 variantes (primary, secondary, ghost) con animación de scale */
const Button = ({ children, variant = 'primary', className = '', ...props }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  [key: string]: any;
}) => {
  const variants = {
    primary: 'noir-gradient-btn text-white shadow-lg shadow-primary/20',
    secondary: 'bg-surface-container-highest/50 border border-outline-variant/10 hover:bg-surface-bright text-on-surface',
    ghost: 'text-on-surface-variant hover:text-on-surface transition-colors',
  };

  return (
    <button
      className={`py-4 px-6 rounded-lg font-bold uppercase tracking-widest text-sm transition-all active:scale-[0.98] hover:scale-[1.01] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Notas de adaptación para implementadores

1. **CSS Modules**: Las clases Tailwind de esta guía deben traducirse a CSS Modules siguiendo la convención del proyecto. Los tokens de color (`surface`, `primary`, etc.) ya existen en el tema actual.
2. **Login social**: Los botones de Google/Apple son placeholder visual. No implementar OAuth a menos que se agregue como HU adicional.
3. **Imágenes**: Reemplazar URLs de Unsplash por assets locales o URLs del CDN del proyecto.
4. **Avatar**: Usar iniciales del usuario o el email como fallback en lugar de dicebear.
5. **Animaciones**: `framer-motion` ya es dependencia del proyecto — reutilizar las animaciones de esta guía.
6. **Responsividad**: El sidebar colapsa a `w-20` (solo íconos) en mobile. Considerar un drawer en pantallas `< md`.
7. **Accesibilidad**: Agregar `aria-label`, `role`, y focus traps que no están en esta guía visual.
