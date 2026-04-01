# Escenarios Gherkin Criticos - SPEC-021

## Datos de prueba sinteticos

| Escenario | Campo | Valido | Invalido | Borde |
|---|---|---|---|---|
| ADM1-edicion-draft | capacity | 140 | 50 (si tiers suman 80+) | igual a suma tiers |
| ADM1-published | title | no editable | cambio de title | campo deshabilitado |
| ADM2-cancelacion | cancellationReason | "Fuerza mayor tecnica" | "corto" | 10 caracteres |
| SEC03-register | password | BuyerPass1 | buyerpass1 | 8 chars exactos |
| SEC06-register-ui | confirmPassword | igual a password | distinta | diferencia de 1 caracter |
| SEC07-interceptor | status HTTP | 200 | 401/403 | rol BUYER en ruta admin |

```gherkin
#language: es
Caracteristica: HU-ADM-01 - Edicion de eventos

  @smoke @critico @ADM1
  Escenario: Administrador edita evento DRAFT exitosamente
    Dado que existe un evento en estado DRAFT
    Y el administrador tiene sesion valida
    Cuando actualiza titulo, descripcion, fecha, aforo y sala
    Entonces el sistema persiste los cambios
    Y el estado del evento permanece en DRAFT

  @error-path @critico @ADM1
  Escenario: Evento PUBLISHED rechaza cambio de campos estructurales
    Dado que existe un evento en estado PUBLISHED
    Cuando el administrador intenta cambiar title, date, capacity o roomId
    Entonces el sistema responde error de validacion
    Y la operacion de actualizacion no se aplica

  @edge-case @ADM1
  Escenario: Rechazo de aforo menor que suma de cupos de tiers
    Dado que el evento tiene tiers con cupos acumulados de 80
    Cuando el administrador intenta bajar el aforo a 50
    Entonces el sistema rechaza el cambio por quota invalida
```

```gherkin
#language: es
Caracteristica: HU-ADM-02 - Cancelacion de eventos

  @smoke @critico @ADM2
  Escenario: Cancelacion exitosa de evento publicado con motivo
    Dado que existe un evento en estado PUBLISHED
    Cuando el administrador confirma la cancelacion con un motivo valido
    Entonces el estado del evento cambia a CANCELLED
    Y la respuesta incluye cancellationReason

  @smoke @critico @ADM2
  Escenario: Al cancelar se publica evento de dominio event.cancelled
    Dado que el evento fue cancelado exitosamente
    Cuando se procesa la cancelacion en ms-events
    Entonces se publica el mensaje RabbitMQ event.cancelled
    Y ms-ticketing y ms-notifications pueden consumirlo

  @smoke @critico @ADM2
  Escenario: Reservas pendientes expiran por event.cancelled
    Dado que existen reservas PENDING para el evento cancelado
    Cuando ms-ticketing consume event.cancelled
    Entonces las reservas pendientes pasan a EXPIRED
    Y no se alteran reservas ya CONFIRMED
```

```gherkin
#language: es
Caracteristica: HU-SEC-03 - Registro y login opcional de comprador en backend

  @smoke @critico @seguridad @SEC03
  Escenario: Registro buyer exitoso retorna JWT con rol BUYER
    Dado que no existe una cuenta con email buyer@example.com
    Cuando se envia POST de registro buyer con password valida
    Entonces el sistema crea usuario con rol BUYER
    Y retorna token JWT y role BUYER

  @error-path @SEC03
  Escenario: Registro buyer con email duplicado retorna conflicto
    Dado que ya existe una cuenta buyer@example.com
    Cuando se intenta registrar el mismo email
    Entonces el sistema responde 409 Conflict

  @edge-case @SEC03
  Escenario: Consulta auth/me con sesion valida retorna perfil
    Dado que el usuario esta autenticado
    Cuando consulta GET /auth/me
    Entonces obtiene id, email, role y created_at del usuario autenticado
```

```gherkin
#language: es
Caracteristica: HU-SEC-06 - Login/registro opcional de comprador en frontend

  @smoke @critico @SEC06
  Escenario: Navegacion publica muestra login/registro sin obligar autenticacion
    Dado que el comprador no esta autenticado
    Cuando ve la barra de navegacion
    Entonces visualiza los accesos Iniciar Sesion y Registrarse
    Y puede continuar navegando el catalogo

  @smoke @critico @SEC06
  Escenario: Registro buyer en UI valida password y confirma creacion
    Dado que el visitante esta en la ruta /registro
    Cuando diligencia email, password valida y confirmacion correcta
    Entonces se invoca registerBuyer
    Y se redirige a la vista posterior al registro

  @edge-case @SEC06
  Escenario: Login buyer redirige al origen de navegacion
    Dado que el comprador llego desde una pagina protegida de compra
    Cuando inicia sesion correctamente
    Entonces vuelve a la ruta origen guardada en from
```

```gherkin
#language: es
Caracteristica: HU-SEC-07 - Interceptores Axios centralizados

  @smoke @critico @seguridad @SEC07
  Escenario: Interceptor agrega token Bearer automaticamente
    Dado que existe jwt_token en sesion
    Cuando cualquier servicio realiza un request HTTP
    Entonces se agrega Authorization Bearer automaticamente

  @smoke @critico @seguridad @SEC07
  Escenario: Error 401 limpia sesion y redirige segun rol
    Dado que un request retorna 401
    Cuando el interceptor procesa el error
    Entonces limpia jwt_token y datos de sesion
    Y redirige a /admin/login para ADMIN o /login para BUYER
    Y emite toast de expiracion de sesion

  @smoke @critico @seguridad @SEC07
  Escenario: Error 403 muestra mensaje de permisos sin redireccion
    Dado que un request retorna 403
    Cuando el interceptor procesa el error
    Entonces emite toast de acceso denegado
    Y no redirige a login
```
