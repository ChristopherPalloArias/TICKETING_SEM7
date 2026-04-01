# Escenarios Gherkin — SPEC-022
## Sprint 3: Métricas, Salas, Navegación, Hardening

**Generado por:** QA Agent (ASDD)
**Spec de referencia:** `.github/specs/sprint3-metricas-salas-navegacion-hardening.spec.md`
**Fecha:** 2026-04-01
**Total de escenarios:** 34

---

## Datos de Prueba Sintéticos

| ID | Campo | Valor válido | Valor inválido | Caso borde |
|----|-------|-------------|----------------|------------|
| DP-001 | JWT BUYER | `eyJ...buyer_valid` (role=BUYER, userId=`u-100`) | `eyJ...expired` | Token sin claim `sub` |
| DP-002 | JWT ADMIN | `eyJ...admin_valid` (role=ADMIN, userId=`u-999`) | `sin_bearer_prefix` | Token BUYER intentando endpoint ADMIN |
| DP-003 | ticketId válido | `tk-550e8400-e29b` (status=VALID) | `tk-00000000-0000` (no existe) | `tk-canc-e29b` (status=CANCELLED) |
| DP-004 | userId comprador | `u-100` | `u-999` (otro usuario) | UUID con formato incorrecto |
| DP-005 | roomId | `rm-a1b2c3` (sin eventos) | `rm-z9y8x7` (con eventos PUBLISHED) | `rm-draft-01` (con evento DRAFT) |
| DP-006 | Sala nombre | "Sala Beethoven" | "" (vacío) | "A" (1 carácter, límite mínimo) |
| DP-007 | Sala capacidad | 500 | -1, 0 | 1 (mínimo absoluto), 99999 (máximo) |
| DP-008 | Email comprador | `juan@email.com` | `no-es-un-email` | Email con dominio muy largo |
| DP-009 | Contraseña nueva | `NuevaPass456` | `sinmayus1`, `SINNUM`, `corta1A` | `Aaaaaaaa1` (8 chars exacto) |
| DP-010 | search query | `"Romeo"` | `"<script>alert(1)</script>"` | `""` (vacío, muestra todos) |

---

## TKT1 — Visualización de tickets del comprador

```gherkin
#language: es
Característica: Vista de tickets del comprador autenticado
  Como comprador autenticado
  Quiero ver mis tickets confirmados en /mis-tickets
  Para tener acceso a toda mi historia de compras

  @smoke @critico @TKT1
  Escenario: TKT1-01 — Comprador ve sus tickets reales ordenados por fecha descendente
    Dado que el comprador "juan@email.com" (userId=u-100) está autenticado con JWT válido (role BUYER)
    Y tiene 3 tickets confirmados en la base de datos con fechas de compra distintas
    Cuando navega a la ruta "/mis-tickets"
    Entonces el sistema realiza la consulta GET /api/v1/tickets?buyerId=u-100
    Y la página muestra los 3 tickets ordenados por fecha de compra descendente
    Y cada ticket muestra: título del evento, fecha del evento, tier, precio pagado, estado "VALID" y fecha de compra
    Y en ningún caso usa datos de localStorage ni valores hardcodeados

  @smoke @seguridad @TKT1
  Escenario: TKT1-02 — Comprador no puede ver tickets de otro usuario
    Dado que el comprador "ana@email.com" (userId=u-200) está autenticado con JWT válido
    Cuando intenta acceder a GET /api/v1/tickets?buyerId=u-100 (otro usuario)
    Entonces recibe respuesta 403 Forbidden
    Y el body contiene solamente el mensaje de error sin información de los tickets de u-100

  @edge-case @TKT1
  Escenario: TKT1-03 — Estado vacío cuando el comprador no tiene tickets
    Dado que el comprador "nuevo@email.com" (userId=u-300) está autenticado
    Y no existe ningún ticket asociado a su cuenta en la base de datos
    Cuando navega a "/mis-tickets"
    Entonces ve el mensaje "Aún no tienes tickets"
    Y aparece un botón "Ver cartelera" que al pulsarlo lo redirige a /events

  @smoke @TKT1
  Escenario: TKT1-04 — Ticket muestra información completa del evento enriquecida
    Dado que el comprador tiene al menos un ticket confirmado (ticketId=tk-550e8400)
    Y ms-ticketing enriquece la respuesta con datos de ms-events
    Cuando consulta GET /api/v1/tickets?buyerId=u-100
    Entonces el ticket en la respuesta incluye: eventTitle="Romeo y Julieta", eventDate="2026-06-15T20:00:00Z", tier="VIP", pricePaid=150000, status="VALID", purchasedAt

  @error-path @TKT1
  Escenario: TKT1-05 — Acceso sin autenticación devuelve 401
    Dado que el cliente hace la petición sin cabecera Authorization
    Cuando consulta GET /api/v1/tickets?buyerId=u-100
    Entonces recibe respuesta 401 Unauthorized
    Y el body no contiene datos de tickets

  @edge-case @TKT1
  Escenario: TKT1-06 — Paginación con más de 10 tickets
    Dado que el comprador tiene 25 tickets confirmados
    Cuando navega a "/mis-tickets" y consulta la segunda página (page=1, size=10)
    Entonces recibe exactamente 10 tickets
    Y la respuesta incluye totalElements=25, totalPages=3, page=1
```

---

## TKT2 — Asociación de tickets anónimos al registrarse

```gherkin
#language: es
Característica: Asociación de tickets anónimos al registrar comprador
  Como comprador que compró anónimamente
  Quiero que al registrarme mis tickets queden en mi cuenta
  Para no perder mi historial de compras previas

  @smoke @critico @TKT2
  Escenario: TKT2-01 — Tickets anónimos se asocian al registrar comprador con el mismo email
    Dado que existen 2 tickets confirmados con buyer_email="juan@email.com" y user_id=NULL
    Cuando Juan se registra con email "juan@email.com" como BUYER
    Entonces api-gateway publica el evento RabbitMQ "user.registered" con payload {userId, email, role="BUYER"}
    Y ms-ticketing consume el evento y ejecuta UPDATE setting user_id para esos 2 tickets
    Y los 2 tickets aparecen en "/mis-tickets" de Juan

  @edge-case @TKT2
  Escenario: TKT2-02 — Registro sin compras previas no genera errores
    Dado que no existe ningún ticket con buyer_email="nuevo@email.com"
    Cuando el usuario se registra con email "nuevo@email.com"
    Entonces el registro se completa exitosamente con status 201
    Y ms-ticketing consume el evento "user.registered" sin fallo
    Y "/mis-tickets" aparece vacío sin errores

  @edge-case @TKT2
  Escenario: TKT2-03 — La asociación es idempotente y no duplica tickets
    Dado que el usuario u-100 ya tiene 1 ticket asociado (user_id=u-100)
    Y tiene además 1 ticket anónimo con buyer_email="juan@email.com" y user_id=NULL
    Cuando el sistema procesa el evento "user.registered" para email="juan@email.com"
    Entonces solo el ticket con user_id=NULL se actualiza a user_id=u-100
    Y el ticket ya asociado no se duplica ni modifica

  @error-path @TKT2
  Escenario: TKT2-04 — Fallo en RabbitMQ no bloquea el registro
    Dado que RabbitMQ está temporalmente caído
    Cuando un usuario nuevo se registra
    Entonces el registro responde 201 Created correctamente
    Y el sistema registra el error de publicación en el log sin exponer detalles al cliente

  @smoke @seguridad @TKT2
  Escenario: TKT2-05 — El evento user.registered no se publica para roles ADMIN
    Dado que un nuevo ADMIN se crea en el sistema
    Cuando se procesa el registro
    Entonces NO se publica el evento "user.registered" a RabbitMQ
    Y no se ejecuta ninguna asociación de tickets para el nuevo ADMIN
```

---

## TKT3 — Descarga de ticket en PDF

```gherkin
#language: es
Característica: Descarga de ticket como archivo PDF
  Como comprador
  Quiero descargar mi ticket en PDF
  Para tener una copia digital de mi entrada

  @smoke @critico @TKT3
  Escenario: TKT3-01 — Descarga exitosa de ticket VALID
    Dado que el comprador u-100 tiene un ticket tk-550e8400 con estado VALID
    Cuando hace clic en "Descargar Ticket" para ese ticket
    Entonces el sistema llama a GET /api/v1/tickets/tk-550e8400/pdf con JWT válido
    Y la respuesta tiene Content-Type="application/pdf"
    Y Content-Disposition="attachment; filename=ticket-tk-550e8400.pdf"
    Y el archivo se descarga automáticamente en el navegador

  @smoke @TKT3
  Escenario: TKT3-02 — El PDF contiene toda la información requerida del ticket
    Dado que se descarga el PDF del ticket tk-550e8400
    Cuando se abre el archivo
    Entonces el contenido incluye: "Romeo y Julieta" (título evento), "2026-06-15 20:00" (fecha), "Sala Principal" (sala), "VIP" (tier), "$150.000" (precio), "tk-550e8400-e29b" (ID UUID), "juan@email.com" (email comprador)

  @error-path @TKT3
  Escenario: TKT3-03 — Ticket cancelado no se puede descargar
    Dado que el comprador tiene un ticket tk-canc-e29b con estado CANCELLED
    Cuando intenta acceder al botón "Descargar Ticket"
    Entonces el botón está visualmente deshabilitado (disabled)
    Y muestra el texto "Este ticket fue cancelado"
    Y si intenta la llamada directa GET /api/v1/tickets/tk-canc-e29b/pdf recibe 400 Bad Request

  @seguridad @TKT3
  Escenario: TKT3-04 — Comprador no puede descargar PDF de ticket ajeno
    Dado que el comprador u-200 intenta descargar el ticket tk-550e8400 que pertenece a u-100
    Cuando llama a GET /api/v1/tickets/tk-550e8400/pdf con JWT de u-200
    Entonces recibe 403 Forbidden
    Y no se genera ni descarga el archivo PDF

  @error-path @TKT3
  Escenario: TKT3-05 — Ticket no encontrado retorna 404
    Dado que el ticketId=tk-00000000-0000 no existe en la base de datos
    Cuando el cliente llama a GET /api/v1/tickets/tk-00000000-0000/pdf
    Entonces recibe 404 Not Found
    Y el body contiene un mensaje de error genérico sin información de stack trace
```

---

## TKT4 — Admin métricas globales (HU-ADM-03)

```gherkin
#language: es
Característica: Dashboard de métricas para el administrador
  Como administrador
  Quiero ver métricas clave en el dashboard
  Para tomar decisiones informadas sobre mis eventos

  @smoke @critico @TKT4
  Escenario: TKT4-01 — Dashboard muestra las 4 tarjetas de resumen correctamente
    Dado que el administrador está autenticado con JWT (role=ADMIN)
    Y el sistema tiene: 42 eventos totales, 15 publicados, 1250 tickets vendidos, 34 reservas activas
    Cuando navega al dashboard "/admin/events"
    Entonces las tarjetas muestran: "Total Eventos: 42", "Eventos Publicados: 15", "Tickets Vendidos: 1.250", "Reservas Activas: 34"

  @smoke @TKT4
  Escenario: TKT4-02 — Tabla muestra métricas por evento con barra de progreso
    Dado que el administrador está en el dashboard y hay eventos publicados
    Cuando revisa la tabla de eventos
    Entonces cada fila muestra tickets vendidos sobre aforo total (ej. "320/500")
    Y una barra de progreso que representa el porcentaje de ocupación
    Y la columna de ingresos estimados (ej. "$48.000.000")

  @edge-case @TKT4
  Escenario: TKT4-03 — Fallback gracioso cuando ms-ticketing no responde
    Dado que ms-ticketing está caído o responde con timeout
    Cuando el administrador carga el dashboard
    Entonces las tarjetas de métricas muestran "--" o "0" con un indicador de "Sin datos disponibles"
    Y la página no colapsa ni muestra código de error al usuario
    Y el resto del dashboard (lista de eventos) sigue funcionando

  @smoke @TKT4
  Escenario: TKT4-04 — Búsqueda filtra eventos por nombre o descripción
    Dado que existen 42 eventos y el administrador escribe "Romeo" en la barra de búsqueda
    Cuando se aplica el debounce y la búsqueda se ejecuta
    Entonces el sistema llama a GET /api/v1/events/admin?search=Romeo&page=0&size=10
    Y la tabla muestra solo los eventos que contienen "Romeo" en título o descripción

  @edge-case @TKT4
  Escenario: TKT4-05 — Paginación funciona con 10 eventos por página
    Dado que existen 42 eventos
    Cuando el administrador está en la página 1 (segunda página, index 0)
    Entonces la tabla muestra exactamente 10 eventos
    Y el paginador indica "Página 1 de 5" (o equivalente)
    Y puede navegar a la página siguiente y anterior

  @seguridad @TKT4
  Escenario: TKT4-06 — BUYER no puede acceder a métricas admin
    Dado que el usuario u-100 tiene rol BUYER
    Cuando llama a GET /api/v1/events/admin/stats con su JWT
    Entonces recibe 403 Forbidden
    Y no recibe ningún dato del dashboard
```

---

## TKT5 — Admin CRUD de salas (HU-ADM-04)

```gherkin
#language: es
Característica: Gestión CRUD de salas por el administrador
  Como administrador
  Quiero crear, editar y eliminar salas
  Para mantener actualizado el catálogo de espacios

  @smoke @critico @TKT5
  Escenario: TKT5-01 — Listado de salas muestra tabla completa
    Dado que el administrador navega a "/admin/rooms"
    Y existen 3 salas registradas en el sistema
    Cuando la página carga completamente
    Entonces la tabla muestra las 3 salas con columnas: nombre, capacidad máxima y cantidad de eventos asociados

  @smoke @critico @TKT5
  Escenario: TKT5-02 — Creación de sala con datos válidos
    Dado que el administrador está en "/admin/rooms" y hace clic en "Crear Sala"
    Cuando ingresa nombre="Sala Beethoven" y capacidad=500 en el formulario modal
    Y confirma el formulario
    Entonces el sistema llama a POST /api/v1/rooms con los datos
    Y la nueva sala aparece inmediatamente en la tabla
    Y el modal se cierra

  @smoke @critico @TKT5
  Escenario: TKT5-03 — Edición de sala actualiza los datos correctamente
    Dado que existe la sala rm-a1b2c3 "Sala Principal" con capacidad=500
    Cuando el administrador hace clic en editar y cambia la capacidad a 600
    Entonces el sistema llama a PUT /api/v1/rooms/rm-a1b2c3 con {name:"Sala Principal", maxCapacity:600}
    Y la tabla refleja la capacidad actualizada "600"

  @error-path @critico @TKT5
  Escenario: TKT5-04 — Sala con eventos asociados no se puede eliminar
    Dado que existe la sala rm-z9y8x7 con 2 eventos en estado PUBLISHED asociados
    Cuando el administrador hace clic en "Eliminar" para esa sala
    Entonces el sistema llama a DELETE /api/v1/rooms/rm-z9y8x7
    Y recibe 400 Bad Request con la lista de eventos: ["Evento 1", "Evento 2"]
    Y la UI muestra el mensaje "No se puede eliminar la sala. Tiene eventos asociados: Evento 1, Evento 2"
    Y la sala permanece en la tabla

  @smoke @TKT5
  Escenario: TKT5-05 — Sala sin eventos se elimina correctamente
    Dado que existe la sala rm-a1b2c3 "Sala Beethoven" sin eventos asociados
    Cuando el administrador hace clic en "Eliminar" y confirma la acción
    Entonces el sistema llama a DELETE /api/v1/rooms/rm-a1b2c3
    Y recibe 204 No Content
    Y la sala desaparece de la tabla

  @error-path @TKT5
  Escenario: TKT5-06 — Creación con datos inválidos muestra errores de validación
    Dado que el administrador abre el modal de creación de sala
    Cuando intenta guardar con nombre="" y capacidad=-1
    Entonces el sistema muestra mensajes: "El nombre es requerido" y "La capacidad debe ser mayor a 0"
    Y no llama a POST /api/v1/rooms

  @edge-case @TKT5
  Escenario: TKT5-07 — Sala con evento en DRAFT también bloquea la eliminación
    Dado que existe la sala rm-draft-01 con 1 evento en estado DRAFT
    Cuando el administrador intenta eliminarla
    Entonces el sistema retorna 400 Bad Request
    Y el mensaje indica que el evento en DRAFT impide la eliminación

  @seguridad @TKT5
  Escenario: TKT5-08 — BUYER no puede crear ni eliminar salas
    Dado que el comprador u-100 (role=BUYER) tiene un JWT válido
    Cuando intenta POST /api/v1/rooms o DELETE /api/v1/rooms/rm-a1b2c3
    Entonces recibe 403 Forbidden en ambos casos
```

---

## Hardening — Headers de seguridad (HU-SEC-08) y Perfil de usuario (HU-USR-01)

```gherkin
#language: es
Característica: Headers de seguridad HTTP en todas las respuestas
  Como sistema
  Quiero que todas las respuestas incluyan headers de seguridad estándar
  Para proteger contra XSS, clickjacking y otros ataques

  @smoke @critico @seguridad @SEC8
  Escenario: SEC8-01 — Todas las respuestas incluyen los 7 headers de seguridad
    Dado que un cliente hace cualquier request al API Gateway (ej. GET /api/v1/events)
    Cuando recibe la respuesta con cualquier código de estado
    Entonces los headers de respuesta contienen todos:
      | Header                    | Valor esperado                                         |
      | X-Content-Type-Options    | nosniff                                               |
      | X-Frame-Options           | DENY                                                  |
      | X-XSS-Protection          | 0                                                     |
      | Strict-Transport-Security | max-age=31536000; includeSubDomains                   |
      | Content-Security-Policy   | default-src 'self'; script-src 'self'                |
      | Referrer-Policy           | strict-origin-when-cross-origin                      |
      | Permissions-Policy        | camera=(), microphone=(), geolocation=()              |

  @smoke @seguridad @SEC8
  Escenario: SEC8-02 — Errores 500 no revelan información interna del sistema
    Dado que un error inesperado ocurre en un microservicio (ej. NullPointerException en ms-events)
    Cuando el cliente recibe la respuesta
    Entonces el código de estado es 500
    Y el body contiene exactamente: {"message": "Error interno del servidor"}
    Y el body NO contiene: stack trace, nombres de clases Java, rutas de archivos del sistema

  @edge-case @seguridad @SEC8
  Escenario: SEC8-03 — Headers de seguridad presentes también en respuestas de error 4xx
    Dado que el cliente envía una petición inválida (ej. JWT expirado → 401)
    Cuando recibe la respuesta 401
    Entonces los headers de seguridad están presentes igualmente
    Y X-Frame-Options=DENY está incluido en la respuesta de error

Característica: Perfil básico del usuario autenticado
  Como usuario autenticado (ADMIN o BUYER)
  Quiero acceder a mi perfil y cambiar mi contraseña
  Para gestionar mi cuenta de forma segura

  @smoke @TKT5-PERFIL
  Escenario: USR1-01 — Vista de perfil muestra datos básicos correctos
    Dado que el comprador u-100 (email="juan@email.com", role=BUYER) está autenticado
    Cuando navega a "/perfil"
    Entonces ve su email "juan@email.com" (campo no editable)
    Y ve su rol "BUYER" (campo no editable)
    Y ve un formulario con campos: "Contraseña actual", "Nueva contraseña", "Confirmar nueva contraseña"

  @smoke @critico @TKT5-PERFIL
  Escenario: USR1-02 — Cambio de contraseña exitoso con contraseña válida
    Dado que el usuario está en "/perfil"
    Cuando ingresa contraseña actual="OldPassword123", nueva contraseña="NuevaPass456" y confirmación="NuevaPass456"
    Entonces el sistema llama a PATCH /api/v1/auth/me/password
    Y recibe 200 con mensaje "Contraseña actualizada exitosamente"
    Y el sistema invalida la sesión actual
    Y el usuario es redirigido a "/login" para autenticarse nuevamente

  @error-path @TKT5-PERFIL
  Escenario: USR1-03 — Contraseña actual incorrecta devuelve error claro
    Dado que el usuario está en "/perfil"
    Cuando ingresa contraseña actual="ContraseñaIncorrecta99" que no coincide con la almacenada
    Entonces el sistema retorna 400 Bad Request
    Y el mensaje de error es "La contraseña actual es incorrecta"
    Y la contraseña almacenada no cambia

  @error-path @TKT5-PERFIL
  Esquema del escenario: USR1-04 — Nueva contraseña no cumple los requisitos de seguridad
    Dado que el usuario está en "/perfil" con contraseña actual correcta
    Cuando ingresa nueva contraseña "<nueva_pass>"
    Entonces el sistema rechaza el cambio con el mensaje "<mensaje_error>"
    Ejemplos:
      | nueva_pass  | mensaje_error                                    |
      | corta1A     | "La contraseña debe tener mínimo 8 caracteres"  |
      | sinmayus1   | "La contraseña debe tener al menos 1 mayúscula" |
      | SINNUM123   | "La contraseña debe tener al menos 1 número"    |
      | Aaaaaaaa1   | (válida — se acepta)                            |

  @edge-case @TKT5-PERFIL
  Escenario: USR1-05 — Admin también puede cambiar su contraseña desde /perfil
    Dado que el administrador u-999 (role=ADMIN) está autenticado
    Cuando navega a "/perfil" y cambia su contraseña correctamente
    Entonces el sistema procesa la solicitud PATCH /api/v1/auth/me/password con éxito
    Y el admin es redirigido a "/login" tras el cambio
```

---

## Resumen de Cobertura

| HU | Criterio | Escenarios | Happy Path | Error Path | Edge Case |
|----|----------|-----------|-----------|-----------|-----------|
| TKT1 — Mis tickets | CRITERI0-TKT1.x | 6 | 2 | 1 | 3 |
| TKT2 — Tickets anónimos | CRITERIO-TKT2.x | 5 | 1 | 2 | 2 |
| TKT3 — PDF tickets | CRITERIO-TKT3.x | 5 | 2 | 2 | 1 |
| TKT4 — Métricas admin | CRITERIO-ADM3.x | 6 | 3 | 1 | 2 |
| TKT5 — CRUD Salas | CRITERIO-ADM4.x | 8 | 3 | 2 | 3 |
| SEC8 — Headers seguridad | CRITERIO-SEC8.x | 3 | 1 | 1 | 1 |
| USR1 — Perfil/contraseña | CRITERIO-USR1.x | 5 | 2 | 2 | 1 |
| **TOTAL** | | **38** | **14** | **11** | **13** |

**Tags de ejecución:**
- `@smoke` → Suite de humo — ejecutar en cada PR
- `@critico` → Bloqueante de release
- `@seguridad` → Obligatorio antes de producción
- `@error-path` → Validación de comportamiento defensivo
- `@edge-case` → Cobertura de casos límite
