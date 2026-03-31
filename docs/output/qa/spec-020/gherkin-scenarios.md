# Escenarios Gherkin — SPEC-020: Sprint 1 Seguridad JWT

**Spec de referencia:** `.github/specs/sprint1-seguridad-jwt-gateway-login.spec.md`
**Generado:** 2026-03-31
**Cobertura:** CRITERIO-1.1 a 1.4 · CRITERIO-2.1 a 2.4 · CRITERIO-4.1 a 4.4 · CRITERIO-5.1 a 5.4

---

## Datos de Prueba

| Escenario           | Campo     | Válido                          | Inválido               | Borde                              |
|---------------------|-----------|---------------------------------|------------------------|------------------------------------|
| Login exitoso       | email     | `admin@sem7-test.com`           | `no-es-email`          | `a@b.c` (email mínimo)             |
| Login exitoso       | password  | `SecurePass123!`                | `wrong-pass`           | 72 caracteres (límite BCrypt)       |
| Rate limiting       | intentos  | 5 intentos fallidos             | 6to intento            | intento 1 después del bloqueo      |
| JWT expiración      | exp claim | 28800 segundos (8h)             | token expirado         | token expira en exactamente 1 seg  |
| Header forjado      | X-Role    | `ADMIN` (desde token válido)    | `ADMIN` (sin token)    | header vacío `X-Role: ""`          |
| Registro admin      | email     | `newadmin@sem7-test.com`        | `admin@sem7-test.com` (duplicado) | —                     |
| Refresh token       | exp_delta | 31 minutos para expirar (no renueva) | 29 min (renueva)  | exactamente 30 min                 |

---

```gherkin
#language: es
Característica: HU-SEC-01 — Autenticación de administrador con JWT

  Como Administrador
  Quiero autenticarme contra el sistema con credenciales reales
  Para que solo usuarios verificados puedan acceder al panel de administración

  Antecedentes:
    Dado que existe un administrador registrado con email "admin@sem7-test.com"
    Y su contraseña ha sido almacenada con BCrypt

  # ─────────────────────────────────────────────────────────
  # CRITERIO-1.1: Login exitoso genera JWT válido
  # ─────────────────────────────────────────────────────────

  @smoke @critico @seguridad @CRITERIO-1.1
  Escenario: Login con credenciales válidas genera JWT firmado
    Dado que el administrador está registrado en el sistema
    Cuando envía credenciales válidas al endpoint de autenticación
      | email    | admin@sem7-test.com |
      | password | SecurePass123!      |
    Entonces recibe una respuesta HTTP 200
    Y el body contiene un campo "token" con valor no vacío
    Y el campo "expiresIn" es igual a 28800
    Y el campo "role" es "ADMIN"
    Y el token es un JWT válido con algoritmo RS256
    Y el claim "role" del token es "ADMIN"
    Y el claim "exp" corresponde a 8 horas desde el momento del login

  # ─────────────────────────────────────────────────────────
  # CRITERIO-1.2: Credenciales inválidas
  # ─────────────────────────────────────────────────────────

  @error-path @seguridad @CRITERIO-1.2
  Escenario: Login con contraseña incorrecta no revela qué campo falló
    Dado que el administrador está registrado en el sistema
    Cuando envía una contraseña incorrecta al endpoint de autenticación
      | email    | admin@sem7-test.com |
      | password | contraseña-erronea  |
    Entonces recibe una respuesta HTTP 401
    Y el body contiene el campo "error" con valor "Credenciales inválidas"
    Y el mensaje de error no menciona "email" ni "contraseña" específicamente
    Y no se incluye información sobre qué campo fue incorrecto

  @error-path @seguridad @CRITERIO-1.2
  Escenario: Login con email inexistente no revela información
    Dado que no existe un usuario con email "fantasma@sem7-test.com"
    Cuando envía credenciales con ese email al endpoint de autenticación
      | email    | fantasma@sem7-test.com |
      | password | cualquierPassword123   |
    Entonces recibe una respuesta HTTP 401
    Y el body contiene el campo "error" con valor "Credenciales inválidas"
    Y el mensaje de error no menciona que el usuario no existe

  # ─────────────────────────────────────────────────────────
  # CRITERIO-1.3: Contraseña almacenada con hash seguro
  # ─────────────────────────────────────────────────────────

  @critico @seguridad @CRITERIO-1.3
  Escenario: El hash de contraseña en base de datos usa BCrypt con cost factor adecuado
    Dado que se registra un nuevo administrador con contraseña "SecurePass123!"
    Cuando se persiste el usuario en la base de datos
    Entonces la columna "password_hash" contiene un valor comenzando con "$2a$" o "$2b$"
    Y el cost factor del hash es mayor o igual a 10
    Y la contraseña en texto plano no aparece en la base de datos
    Y la contraseña en texto plano no aparece en los logs de la aplicación

  @critico @seguridad @CRITERIO-1.3
  Escenario: El response del login no expone el hash de contraseña
    Dado que el administrador está registrado en el sistema
    Cuando realiza un login exitoso con credenciales válidas
    Entonces el body de la respuesta no contiene ningún campo relacionado con la contraseña
    Y no aparece "password" ni "hash" en el response body

  # ─────────────────────────────────────────────────────────
  # CRITERIO-1.4: Rate limiting en endpoint de login
  # ─────────────────────────────────────────────────────────

  @edge-case @seguridad @CRITERIO-1.4
  Escenario: El sexto intento de login fallido desde la misma IP es rechazado
    Dado que la IP "192.168.1.100" ha realizado 5 intentos de login fallidos en los últimos 15 minutos
    Cuando la misma IP realiza un sexto intento de login
      | email    | admin@sem7-test.com |
      | password | contraseña-erronea  |
    Entonces recibe una respuesta HTTP 429
    Y el body contiene el campo "error" con valor "Demasiados intentos. Intente de nuevo más tarde"
    Y el header "Retry-After" indica cuándo puede reintentar

  @edge-case @seguridad @CRITERIO-1.4
  Escenario: El rate limiting se aplica por IP, no por usuario
    Dado que la IP "192.168.1.200" ha realizado 5 intentos fallidos con email "admin@sem7-test.com"
    Cuando la misma IP intenta login con un email diferente "otro@sem7-test.com"
    Entonces recibe una respuesta HTTP 429
    Y el sistema aplica el límite por IP independientemente del email utilizado

  @edge-case @CRITERIO-1.4
  Escenario: Después del período de bloqueo se permite reintentar
    Dado que la IP "192.168.1.101" tiene el rate limit activo por exceso de intentos
    Y han transcurrido más de 15 minutos desde el primer intento fallido
    Cuando realiza un nuevo intento de login con credenciales válidas
    Entonces recibe una respuesta HTTP 200
    Y se genera un token JWT válido
```

---

```gherkin
#language: es
Característica: HU-SEC-02 — Validación de JWT en el API Gateway y propagación segura

  Como Sistema
  Quiero que el API Gateway valide los tokens JWT en cada request a endpoints protegidos
  Para eliminar la posibilidad de falsificación de headers de identidad

  Antecedentes:
    Dado que existe un JWT válido generado para el administrador "admin@sem7-test.com"
    Y el gateway tiene la clave pública RS256 configurada

  # ─────────────────────────────────────────────────────────
  # CRITERIO-2.1: Gateway valida JWT y propaga claims como headers internos
  # ─────────────────────────────────────────────────────────

  @smoke @critico @seguridad @CRITERIO-2.1
  Escenario: Request con JWT válido propaga claims como headers internos al microservicio
    Dado que el administrador tiene un JWT válido con claim "role: ADMIN"
    Y el JWT tiene claim "sub: uuid-admin-001"
    Cuando envía una petición al gateway con header "Authorization: Bearer <token-valido>"
    Entonces el gateway verifica la firma RS256 del token
    Y el microservicio downstream recibe el header "X-User-Id" con el UUID del administrador
    Y el microservicio downstream recibe el header "X-Role" con valor "ADMIN"
    Y el request llega correctamente al microservicio destino

  @smoke @critico @seguridad @CRITERIO-2.1
  Escenario: El gateway elimina headers X-Role y X-User-Id enviados por el cliente
    Dado que un cliente envía manualmente los headers "X-Role: ADMIN" y "X-User-Id: uuid-falso"
    Y el cliente también envía un JWT válido con su propia identidad
    Cuando el request llega al gateway
    Entonces el gateway descarta los headers "X-Role" y "X-User-Id" del cliente
    Y el microservicio downstream recibe solo los headers inyectados desde el JWT verificado

  # ─────────────────────────────────────────────────────────
  # CRITERIO-2.2: Request sin token a endpoint protegido es rechazado
  # ─────────────────────────────────────────────────────────

  @error-path @seguridad @CRITERIO-2.2
  Escenario: Acceso a endpoint protegido sin header Authorization es rechazado
    Dado que un cliente no autenticado no envía header "Authorization"
    Cuando intenta crear un evento enviando POST a "/api/v1/events"
    Entonces el gateway rechaza el request con HTTP 401
    Y el request nunca llega al microservicio de eventos
    Y el microservicio ms-events no registra ninguna actividad de ese request

  @error-path @seguridad @CRITERIO-2.2
  Escenario: Token JWT expirado es rechazado en endpoint protegido
    Dado que un administrador tiene un JWT expirado (generado hace más de 8 horas)
    Cuando envía una petición al endpoint protegido "/api/v1/events" con ese token
    Entonces recibe una respuesta HTTP 401
    Y el request no llega al microservicio downstream

  @error-path @seguridad @CRITERIO-2.2
  Escenario: Token JWT con firma inválida es rechazado
    Dado que existe un token JWT con firma manipulada manualmente
    Cuando un cliente envía ese token al gateway en el header Authorization
    Entonces recibe una respuesta HTTP 401
    Y el gateway rechaza el request antes de reenviarlo

  # ─────────────────────────────────────────────────────────
  # CRITERIO-2.3: Endpoints públicos accesibles sin token
  # ─────────────────────────────────────────────────────────

  @smoke @critico @CRITERIO-2.3
  Escenario: Consulta de eventos funcionan sin autenticación
    Dado que un comprador anónimo no tiene token JWT
    Cuando consulta el listado de eventos disponibles en "GET /api/v1/events"
    Entonces recibe una respuesta HTTP 200 con el catálogo de eventos
    Y no necesita enviar ningún header de autorización

  @smoke @CRITERIO-2.3
  Escenario: Consulta de detalle de evento accesible sin token
    Dado que un comprador anónimo no tiene token JWT
    Cuando consulta el detalle de un evento específico "GET /api/v1/events/uuid-evento-001"
    Entonces recibe una respuesta HTTP 200 con los detalles del evento

  @smoke @CRITERIO-2.3
  Escenario: El endpoint de login es accesible sin token
    Dado que un usuário no autenticado quiere iniciar sesión
    Cuando envía credenciales a "POST /api/v1/auth/login" sin header Authorization
    Entonces el gateway permite el request al controlador de autenticación
    Y recibe respuesta según las credenciales enviadas (200 o 401)

  # ─────────────────────────────────────────────────────────
  # CRITERIO-2.4: Headers del cliente no pueden sobrescribir la identidad
  # ─────────────────────────────────────────────────────────

  @smoke @critico @seguridad @CRITERIO-2.4
  Escenario: Header X-Role forjado sin token es eliminado por el gateway
    Dado que un atacante envía manualmente el header "X-Role: ADMIN" sin token JWT
    Cuando el request llega al gateway a un endpoint público
    Entonces el gateway elimina el header "X-Role" del request
    Y el microservicio downstream no recibe el header "X-Role"
    Y el request se procesa como anónimo (sin identidad verificada)

  @critico @seguridad @CRITERIO-2.4
  Escenario: Header X-User-Id forjado sin token es eliminado por el gateway
    Dado que un atacante envía manualmente el header "X-User-Id: uuid-admin-001" sin token JWT
    Cuando el request llega al gateway
    Entonces el gateway elimina el header "X-User-Id" del request
    Y el microservicio downstream no recibe el header "X-User-Id"
```

---

```gherkin
#language: es
Característica: HU-SEC-04 — Securización de configuración y credenciales de infraestructura

  Como DevOps
  Quiero que las credenciales de infraestructura sean seguras y no estén hardcodeadas
  Para prevenir accesos no autorizados a bases de datos y servicios de mensajería

  # ─────────────────────────────────────────────────────────
  # CRITERIO-4.1: Credenciales configuradas por entorno
  # ─────────────────────────────────────────────────────────

  @critico @seguridad @CRITERIO-4.1
  Escenario: Las credenciales de PostgreSQL no usan el valor por defecto
    Dado que el sistema se ha desplegado en un ambiente de staging
    Cuando se revisan las variables de entorno de configuración
    Entonces la contraseña de PostgreSQL no es "postgres"
    Y la URL de conexión no contiene "password=postgres"

  @critico @seguridad @CRITERIO-4.1
  Escenario: Las credenciales de RabbitMQ no usan guest/guest
    Dado que el sistema se ha desplegado en cualquier ambiente
    Cuando se revisan las variables de entorno de RabbitMQ
    Entonces el usuario de RabbitMQ no es "guest"
    Y la contraseña de RabbitMQ no es "guest"

  @critico @seguridad @CRITERIO-4.1
  Escenario: El secreto JWT no contiene valores de desarrollo
    Dado que el sistema está configurado para cualquier ambiente
    Cuando se revisa la variable de configuración del secreto JWT
    Entonces el secreto no contiene la cadena "dev-secret"
    Y el valor proviene de una variable de entorno o sistema de secrets

  @critico @seguridad @CRITERIO-4.1
  Escenario: El archivo .env no está versionado en el repositorio
    Dado que se inspecciona el repositorio de código
    Cuando se busca el archivo ".env" con valores reales
    Entonces el archivo ".env" no existe en el historial de git
    Y existe un archivo ".env.example" con placeholders como valores

  # ─────────────────────────────────────────────────────────
  # CRITERIO-4.2: CORS restringido
  # ─────────────────────────────────────────────────────────

  @seguridad @CRITERIO-4.2
  Escenario: La configuración CORS no usa wildcard en producción
    Dado que el API Gateway se ejecuta con profile "prod"
    Cuando se revisa la configuración CORS del gateway
    Entonces "allowedOrigins" lista orígenes específicos y no contiene "*"
    Y "allowedHeaders" lista headers específicos y no contiene "*"

  @edge-case @seguridad @CRITERIO-4.2
  Escenario: Requests CORS desde origen no autorizado son rechazados
    Dado que el API Gateway tiene CORS configurado para "http://localhost:5173"
    Cuando un cliente desde "http://sitio-malicioso.com" envía un request CORS
    Entonces el gateway responde con error CORS
    Y el header "Access-Control-Allow-Origin" no incluye el origen del atacante

  # ─────────────────────────────────────────────────────────
  # CRITERIO-4.3: Swagger deshabilitado en producción
  # ─────────────────────────────────────────────────────────

  @seguridad @CRITERIO-4.3
  Escenario: Swagger UI no es accesible en profile prod
    Dado que el sistema se ejecuta con el profile de Spring "prod"
    Cuando un usuario intenta acceder a "/swagger-ui.html"
    Entonces recibe una respuesta HTTP 404
    Y el endpoint "/v3/api-docs" tampoco devuelve documentación

  @edge-case @CRITERIO-4.3
  Escenario: Swagger UI sí es accesible en profile dev
    Dado que el sistema se ejecuta con el profile de Spring "dev"
    Cuando un desarrollador accede a "/swagger-ui.html"
    Entonces recibe una respuesta HTTP 200 con la interfaz de Swagger

  # ─────────────────────────────────────────────────────────
  # CRITERIO-4.4: Solo el gateway expone puerto al exterior
  # ─────────────────────────────────────────────────────────

  @critico @seguridad @CRITERIO-4.4
  Escenario: En producción solo el puerto del gateway está expuesto al host
    Dado que el sistema se ejecuta con "docker-compose.prod.yml"
    Cuando se inspeccionan los puertos expuestos de los contenedores
    Entonces el puerto 8080 del API Gateway está mapeado al host
    Y el puerto de PostgreSQL (5432) no tiene binding al host
    Y el puerto de RabbitMQ (5672) no tiene binding al host
    Y el puerto del panel de RabbitMQ (15672) no tiene binding al host
```

---

```gherkin
#language: es
Característica: HU-SEC-05 — Pantalla de login real para el administrador

  Como Administrador
  Quiero una pantalla de login que valide mis credenciales contra el backend
  Para no depender de credenciales hardcodeadas en el código fuente del frontend

  Antecedentes:
    Dado que el backend de autenticación está disponible en su URL configurada
    Y el administrador está en la página "/admin/login"

  # ─────────────────────────────────────────────────────────
  # CRITERIO-5.1: Login contra API real
  # ─────────────────────────────────────────────────────────

  @smoke @critico @CRITERIO-5.1
  Escenario: Login exitoso redirige al dashboard de administración
    Dado que el administrador ingresa su email "admin@sem7-test.com"
    Y ingresa su contraseña "SecurePass123!"
    Cuando presiona el botón "Iniciar Sesión"
    Entonces el frontend envía las credenciales al endpoint de autenticación
    Y el JWT recibido se almacena de forma segura (memoria/sessionStorage, no localStorage)
    Y el usuario es redirigido a la ruta "/admin/events"
    Y el dashboard de administración muestra el contenido protegido

  @smoke @critico @CRITERIO-5.1
  Escenario: El JWT es incluido en requests subsiguientes al backend
    Dado que el administrador ha iniciado sesión exitosamente
    Y el JWT está almacenado en la sesión del frontend
    Cuando el frontend realiza una petición a un endpoint protegido
    Entonces el header "Authorization: Bearer <token>" se incluye automáticamente
    Y el gateway acepta el request y retorna la información solicitada

  # ─────────────────────────────────────────────────────────
  # CRITERIO-5.2: Credenciales inválidas en UI
  # ─────────────────────────────────────────────────────────

  @error-path @CRITERIO-5.2
  Escenario: Credenciales incorrectas muestran mensaje genérico sin revelar detalles
    Dado que el administrador ingresa credenciales incorrectas en el formulario de login
      | email    | admin@sem7-test.com |
      | password | contrasena-erronea  |
    Cuando presiona el botón "Iniciar Sesión"
    Entonces aparece el mensaje de error "Credenciales inválidas"
    Y el mensaje no especifica si el error fue en email o contraseña
    Y el campo de contraseña queda vacío
    Y no se realiza redirección al dashboard

  @error-path @CRITERIO-5.2
  Escenario: El campo de contraseña se limpia tras un login fallido
    Dado que el administrador ha ingresado credenciales incorrectas
    Cuando el sistema muestra el error de credenciales
    Entonces el campo "contraseña" del formulario queda vacío
    Y el campo "email" conserva el valor ingresado para facilitar el reintento

  # ─────────────────────────────────────────────────────────
  # CRITERIO-5.3: Sin credenciales en código fuente
  # ─────────────────────────────────────────────────────────

  @critico @seguridad @CRITERIO-5.3
  Escenario: No existen credenciales hardcodeadas en el código del frontend
    Dado que se analiza el código fuente del frontend compilado y sin compilar
    Cuando se busca la cadena "admin@sem7.com" o "admin123" en los archivos
    Entonces no se encuentran esas cadenas en ningún archivo del proyecto
    Y no existe ninguna variable de usuario/contraseña definida en el código

  @critico @seguridad @CRITERIO-5.3
  Escenario: AuthContext no contiene validación local de credenciales
    Dado que se revisa el código de AuthContext.tsx
    Cuando se busca lógica de validación de email/contraseña local
    Entonces no existe comparación de credenciales en el frontend
    Y toda validación se delega al endpoint de autenticación del backend

  # ─────────────────────────────────────────────────────────
  # CRITERIO-5.4: Token JWT renovado automáticamente
  # ─────────────────────────────────────────────────────────

  @edge-case @CRITERIO-5.4
  Escenario: El token se renueva automáticamente cuando está próximo a expirar
    Dado que el administrador está autenticado con un JWT
    Y el token expirará en 25 minutos (menos de 30 minutos restantes)
    Cuando el administrador realiza cualquier acción en el panel de administración
    Entonces el frontend detecta que el token está próximo a expirar
    Y solicita automáticamente un token renovado al backend
    Y actualiza el token almacenado en sesión
    Y la sesión del administrador continúa sin interrupciones

  @edge-case @CRITERIO-5.4
  Escenario: Token con más de 30 minutos de vigencia no activa renovación
    Dado que el administrador está autenticado con un JWT
    Y el token expirará en 45 minutos (más de 30 minutos restantes)
    Cuando el administrador realiza una acción en el panel
    Entonces el frontend NO solicita renovación del token
    Y el token almacenado permanece sin cambios

  @edge-case @seguridad @CRITERIO-5.4
  Escenario: Token expirado redirige al login sin exponer información
    Dado que el administrador tiene un JWT completamente expirado (más de 8 horas)
    Cuando intenta acceder a una sección del panel de administración
    Entonces el frontend detecta el token inválido vía respuesta 401 del backend
    Y redirige al administrador a la pantalla de login "/admin/login"
    Y limpia cualquier dato de sesión almacenado
```

---

## Resumen de Cobertura

| Criterio      | HU        | Escenarios | Happy Path | Error Path | Edge Case |
|---------------|-----------|-----------|------------|------------|-----------|
| CRITERIO-1.1  | HU-SEC-01 | 1         | ✅          | —          | —         |
| CRITERIO-1.2  | HU-SEC-01 | 2         | —          | ✅✅         | —         |
| CRITERIO-1.3  | HU-SEC-01 | 2         | ✅          | ✅          | —         |
| CRITERIO-1.4  | HU-SEC-01 | 3         | ✅          | —          | ✅✅        |
| CRITERIO-2.1  | HU-SEC-02 | 2         | ✅✅         | —          | —         |
| CRITERIO-2.2  | HU-SEC-02 | 3         | —          | ✅✅✅        | —         |
| CRITERIO-2.3  | HU-SEC-02 | 3         | ✅✅✅        | —          | —         |
| CRITERIO-2.4  | HU-SEC-02 | 2         | ✅✅         | —          | —         |
| CRITERIO-4.1  | HU-SEC-04 | 4         | ✅✅✅✅       | —          | —         |
| CRITERIO-4.2  | HU-SEC-04 | 2         | ✅          | —          | ✅         |
| CRITERIO-4.3  | HU-SEC-04 | 2         | ✅          | —          | ✅         |
| CRITERIO-4.4  | HU-SEC-04 | 1         | ✅          | —          | —         |
| CRITERIO-5.1  | HU-SEC-05 | 2         | ✅✅         | —          | —         |
| CRITERIO-5.2  | HU-SEC-05 | 2         | —          | ✅✅         | —         |
| CRITERIO-5.3  | HU-SEC-05 | 2         | ✅✅         | —          | —         |
| CRITERIO-5.4  | HU-SEC-05 | 3         | —          | ✅          | ✅✅        |
| **Total**     |           | **36**    | **18**     | **11**     | **7**     |
