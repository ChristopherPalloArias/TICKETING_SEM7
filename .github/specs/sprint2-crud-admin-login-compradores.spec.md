---
id: SPEC-021
status: DRAFT
feature: sprint2-crud-admin-login-compradores
created: 2026-03-31
updated: 2026-03-31
author: spec-generator
version: "1.0"
related-specs: [SPEC-020]
---

# Spec: Sprint 2 — CRUD Admin + Login Opcional Compradores

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Implementar interceptores Axios centralizados para manejo de autenticación, edición y cancelación de eventos para administradores, y login/registro opcional de compradores en backend y frontend. Construye sobre la infraestructura JWT del Sprint 1.

### Requerimiento de Negocio
El panel de administración carece de CRUD completo (no se puede editar ni cancelar eventos) y los compradores no tienen opción de crear cuenta para ver historial. Además, cada service file del frontend maneja headers manualmente, creando inconsistencia y duplicación.

### Historias de Usuario

#### HU-SEC-07: Interceptores Axios centralizados y manejo de errores de seguridad

```
Como:        Desarrollador
Quiero:      un interceptor Axios centralizado que maneje JWT, errores 401/403 y CSRF
Para:        no repetir lógica de autenticación en cada service file

Prioridad:   Alta
Estimación:  S (3 SP)
Dependencias: HU-SEC-05 (SPEC-020)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-SEC-07

**Happy Path**
```gherkin
CRITERIO-7.1: Token JWT inyectado automáticamente
  Dado que:  un usuario está autenticado con un JWT
  Cuando:    cualquier service file hace un request HTTP
  Entonces:  el interceptor agrega "Authorization: Bearer <token>" automáticamente
  Y los service files no necesitan manejar el token manualmente
```

**Error Path**
```gherkin
CRITERIO-7.2: Error 401 redirige a login
  Dado que:  el usuario está autenticado pero su token ha expirado
  Cuando:    cualquier request retorna 401 Unauthorized
  Entonces:  el interceptor limpia la sesión
  Y redirige al usuario a la pantalla de login correspondiente (admin o buyer)
  Y muestra un toast "Tu sesión ha expirado"
```

```gherkin
CRITERIO-7.3: Error 403 muestra mensaje de acceso denegado
  Dado que:  un BUYER intenta acceder a un endpoint de ADMIN
  Cuando:    el request retorna 403 Forbidden
  Entonces:  muestra un mensaje "No tienes permisos para esta acción"
  Y no redirige a login (el usuario está autenticado, solo no autorizado)
```

---

#### HU-ADM-01: Edición de eventos existentes

```
Como:        Administrador
Quiero:      editar la información de un evento después de haberlo creado
Para:        corregir errores o actualizar datos sin tener que crear un evento nuevo

Prioridad:   Alta
Estimación:  M (5 SP)
Dependencias: HU-01 (SPEC-001)
Capa:        Ambas (ms-events + frontend)
```

#### Criterios de Aceptación — HU-ADM-01

**Happy Path**
```gherkin
CRITERIO-ADM1.1: Edición completa de evento borrador
  Dado que:  existe un evento en estado "DRAFT"
  Cuando:    el administrador modifica cualquier campo (título, descripción, fecha, aforo, sala, imagen, etc.) y envía los cambios
  Entonces:  el sistema actualiza el evento con los nuevos datos
  Y mantiene el estado "DRAFT"
```

**Edge Case**
```gherkin
CRITERIO-ADM1.2: Edición limitada de evento publicado
  Dado que:  existe un evento en estado "PUBLISHED"
  Cuando:    el administrador intenta editar
  Entonces:  solo puede modificar: descripción, subtítulo, imagen, director, elenco, ubicación
  Y NO puede modificar: título, fecha, aforo, sala (campos estructurales)
  Y el formulario muestra los campos no editables como deshabilitados
```

```gherkin
CRITERIO-ADM1.3: Validación de aforo al editar
  Dado que:  un evento en borrador tiene tiers configurados con cupos que suman 80
  Cuando:    el administrador intenta cambiar el aforo a 50
  Entonces:  el sistema rechaza el cambio porque los cupos existentes (80) superan el nuevo aforo (50)
```

---

#### HU-ADM-02: Cancelación de eventos

```
Como:        Administrador
Quiero:      poder cancelar un evento publicado
Para:        manejar situaciones donde un evento no puede realizarse

Prioridad:   Alta
Estimación:  S (3 SP)
Dependencias: Ninguna
Capa:        Ambas (ms-events, ms-ticketing, ms-notifications, frontend)
```

#### Criterios de Aceptación — HU-ADM-02

**Happy Path**
```gherkin
CRITERIO-ADM2.1: Cancelación exitosa con confirmación
  Dado que:  existe un evento en estado "PUBLISHED"
  Cuando:    el administrador hace clic en "Cancelar Evento"
  Entonces:  aparece un modal de confirmación solicitando motivo de cancelación
  Y al confirmar, el sistema cambia el estado del evento a "CANCELLED"
  Y el evento ya no aparece en la cartelera pública
```

```gherkin
CRITERIO-ADM2.2: Compradores notificados de cancelación
  Dado que:  un evento cancelado tiene reservas activas o tickets vendidos
  Cuando:    el evento se cancela
  Entonces:  el sistema publica un evento RabbitMQ "event.cancelled"
  Y ms-notifications envía notificación a todos los compradores afectados
```

```gherkin
CRITERIO-ADM2.3: Reservas del evento cancelado se liberan
  Dado que:  un evento cancelado tiene reservas en estado "PENDING"
  Cuando:    el evento se cancela
  Entonces:  todas las reservas pendientes pasan a estado "EXPIRED"
  Y los cupos se liberan
```

---

#### HU-SEC-03: Registro y login opcional de comprador

```
Como:        Comprador
Quiero:      poder crear una cuenta opcionalmente y autenticarme en el sistema
Para:        ver mi historial de compras y no tener que ingresar mis datos cada vez

Prioridad:   Media
Estimación:  M (5 SP)
Dependencias: HU-SEC-01 (SPEC-020)
Capa:        Backend (api-gateway)
```

#### Criterios de Aceptación — HU-SEC-03

**Happy Path**
```gherkin
CRITERIO-3.1: Registro exitoso de comprador
  Dado que:  un visitante no tiene cuenta en el sistema
  Cuando:    envía email y contraseña a POST /api/v1/auth/register/buyer
  Entonces:  se crea una cuenta con role "BUYER"
  Y recibe un JWT válido con role "BUYER"
  Y puede usar el token para futuras acciones autenticadas
```

```gherkin
CRITERIO-3.2: Compra anónima sin cambios
  Dado que:  un comprador no desea crear cuenta
  Cuando:    accede al detalle de un evento y selecciona tickets
  Entonces:  puede completar la reserva y pago sin autenticarse
  Y solo necesita proporcionar su email para la notificación
  Y recibe un buyerId transitorio generado por el sistema
```

```gherkin
CRITERIO-3.3: Compra con cuenta autenticada
  Dado que:  un comprador tiene cuenta y está logueado con JWT
  Cuando:    inicia una reserva
  Entonces:  el sistema usa el email de su cuenta automáticamente
  Y asocia la reserva a su userId permanente (en lugar de buyerId transitorio)
```

**Error Path**
```gherkin
CRITERIO-3.4: Email duplicado rechazado
  Dado que:  ya existe una cuenta con el email "buyer@example.com"
  Cuando:    otro visitante intenta registrarse con el mismo email
  Entonces:  recibe un error 409 Conflict
  Y el mensaje indica que el email ya está registrado
```

---

#### HU-SEC-06: Login y registro opcional para compradores en el frontend

```
Como:        Comprador
Quiero:      poder crear una cuenta o iniciar sesión opcionalmente desde la aplicación
Para:        tener un historial de mis compras y completar reservas más rápido

Prioridad:   Media
Estimación:  M (5 SP)
Dependencias: HU-SEC-03
Capa:        Frontend
```

#### Criterios de Aceptación — HU-SEC-06

**Happy Path**
```gherkin
CRITERIO-6.1: Botón de login visible pero no obligatorio
  Dado que:  un comprador está navegando la cartelera
  Cuando:    mira la barra de navegación
  Entonces:  ve un botón "Iniciar Sesión" / "Registrarse"
  Y puede seguir navegando y comprando sin hacer clic en él
```

```gherkin
CRITERIO-6.2: Registro de comprador
  Dado que:  un visitante hace clic en "Registrarse"
  Cuando:    ingresa email y contraseña (mínimo 8 caracteres, una mayúscula, un número)
  Y confirma la contraseña y presiona "Crear Cuenta"
  Entonces:  se crea su cuenta vía "POST /api/v1/auth/register/buyer"
  Y queda autenticado automáticamente
  Y se redirige a la página desde la que vino
```

```gherkin
CRITERIO-6.3: Email pre-llenado en checkout
  Dado que:  un comprador está autenticado
  Cuando:    accede al checkout de un ticket
  Entonces:  el campo de email aparece pre-llenado con su email de cuenta
  Y no es editable
```

```gherkin
CRITERIO-6.4: Historial de tickets para compradores autenticados
  Dado que:  un comprador está autenticado con role BUYER
  Cuando:    navega a "/mis-tickets"
  Entonces:  ve los tickets asociados a su cuenta
  Y están ordenados por fecha de compra descendente
```

### Reglas de Negocio

1. **Compra anónima intacta**: flujo sin token sigue usando `buyerId` transitorio + `buyerEmail` en body.
2. **Comprador autenticado**: si hay JWT con role BUYER, usar `userId` del token como `buyerId` en la reserva. Email del token se usa automáticamente.
3. **BUYER no ve admin**: un comprador autenticado NO puede acceder a rutas `/admin/*`.
4. **Campos editables según estado del evento**:
   - `DRAFT`: todos los campos editables.
   - `PUBLISHED`: solo descripción, subtítulo, imagen, director, elenco, ubicación.
5. **Aforo no puede bajar por debajo de la suma de cupos** de tiers existentes.
6. **Cancelación solo para PUBLISHED**: un evento DRAFT se puede eliminar, uno PUBLISHED se cancela.
7. **Cancelación publica `event.cancelled`** en RabbitMQ → ms-ticketing expira reservas PENDING, ms-notifications envía emails.
8. **Email de registro de comprador**: debe ser único (constraint de BD). Misma tabla `users` que admins pero con role `BUYER`.
9. **Contraseña del comprador**: mínimo 8 caracteres, 1 mayúscula, 1 número.
10. **Interceptor Axios**: instancia centralizada en `services/apiClient.ts`. Todos los service files migran a esta instancia.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `User` | tabla `users` (BD api-gateway) | Sin cambios de esquema | Registro de compradores usa misma tabla con role BUYER |
| `Event` | tabla `events` (BD ms-events) | agregar estado `CANCELLED` | Nuevo estado válido en el ciclo de vida del evento |

#### Estado `CANCELLED` del evento
- Agregar `CANCELLED` al enum/validación de estados en `Event`.
- Un evento `CANCELLED` no aparece en cartelera pública (`GET /api/v1/events` lo excluye).
- Un evento `CANCELLED` sí aparece en el listado admin con badge rojo.

### API Endpoints

#### PUT /api/v1/events/{id}
- **Descripción**: Actualiza un evento existente
- **Auth requerida**: sí (ADMIN)
- **Microservicio**: ms-events
- **Request Body** (campos opcionales):
  ```json
  {
    "title": "Nuevo Título",
    "subtitle": "Nuevo Subtítulo",
    "description": "Nueva Descripción",
    "date": "2026-06-15T20:00:00Z",
    "capacity": 500,
    "roomId": "uuid-room",
    "imageUrl": "https://...",
    "director": "Nombre Director",
    "cast": "Actor 1, Actor 2",
    "location": "Dirección"
  }
  ```
- **Response 200**: evento actualizado completo
- **Response 400**: validación fallida (aforo menor a cupos de tiers)
- **Response 401**: token ausente o inválido
- **Response 403**: rol insuficiente
- **Response 404**: evento no encontrado
- **Nota**: si evento está PUBLISHED, campos estructurales (title, date, capacity, roomId) se ignoran o retornan 400

#### PATCH /api/v1/events/{id}/cancel
- **Descripción**: Cancela un evento publicado
- **Auth requerida**: sí (ADMIN)
- **Microservicio**: ms-events
- **Request Body**:
  ```json
  {
    "cancellationReason": "Motivo de la cancelación"
  }
  ```
- **Response 200**:
  ```json
  {
    "id": "uuid",
    "title": "Nombre Evento",
    "status": "CANCELLED",
    "cancellationReason": "Motivo de la cancelación",
    "updated_at": "2026-03-31T10:00:00Z"
  }
  ```
- **Response 400**: `{ "error": "Solo eventos PUBLISHED pueden cancelarse" }`
- **Response 401**: token ausente
- **Response 403**: rol insuficiente
- **Response 404**: evento no encontrado

#### POST /api/v1/auth/register/buyer
- **Descripción**: Registro público de compradores
- **Auth requerida**: no
- **Microservicio**: api-gateway
- **Request Body**:
  ```json
  {
    "email": "comprador@example.com",
    "password": "MiPassword123"
  }
  ```
- **Response 201**:
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiJ9...",
    "expiresIn": 28800,
    "role": "BUYER"
  }
  ```
- **Response 400**: contraseña no cumple requisitos (min 8, 1 mayúscula, 1 número)
- **Response 409**: email ya registrado

#### GET /api/v1/auth/me
- **Descripción**: Retorna perfil del usuario autenticado
- **Auth requerida**: sí (ADMIN o BUYER)
- **Microservicio**: api-gateway
- **Response 200**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "BUYER",
    "created_at": "2026-03-31T10:00:00Z"
  }
  ```
- **Response 401**: token ausente o inválido

#### RabbitMQ Event: `event.cancelled`
- **Publicado por**: ms-events
- **Consumido por**: ms-ticketing, ms-notifications
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventTitle": "Nombre del Evento",
    "cancellationReason": "Motivo",
    "cancelledAt": "2026-03-31T10:00:00Z"
  }
  ```
- **Acción en ms-ticketing**: expirar todas las reservas PENDING del eventId
- **Acción en ms-notifications**: enviar email de cancelación a compradores con reservas/tickets del evento

### Diseño Frontend

#### Componentes nuevos
| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `BuyerLoginPage` | `pages/BuyerLoginPage.tsx` | — | Página de login para compradores |
| `BuyerRegisterPage` | `pages/BuyerRegisterPage.tsx` | — | Página de registro para compradores |
| `CancelEventModal` | `components/CancelEventModal.tsx` | `eventId, isOpen, onClose, onConfirm` | Modal de confirmación de cancelación |

#### Componentes modificados
| Componente | Archivo | Cambios |
|------------|---------|---------|
| `EventForm` | `components/EventForm.tsx` | Modo edición: cargar datos existentes, deshabilitar campos según estado |
| `EventDetailAdmin` | `pages/EventDetailAdmin.tsx` | Botón "Editar" y "Cancelar Evento" |
| `NavBar` | `components/NavBar.tsx` | Botón "Iniciar Sesión" / "Registrarse" para compradores |
| `EventsDashboard` | `pages/EventsDashboard.tsx` | Badge CANCELLED en tabla |

#### Páginas nuevas
| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `BuyerLoginPage` | `pages/BuyerLoginPage.tsx` | `/login` | no |
| `BuyerRegisterPage` | `pages/BuyerRegisterPage.tsx` | `/registro` | no |
| `EditEventPage` | `pages/EditEventPage.tsx` | `/admin/events/:id/edit` | sí (ADMIN) |

#### Hooks y State
| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| — | — | — | Se reutiliza `useAuth()` existente para compradores |

#### Services (llamadas API)
| Función | Archivo | Endpoint |
|---------|---------|---------|
| `registerBuyer(email, password)` | `services/authService.ts` | `POST /api/v1/auth/register/buyer` |
| `getProfile()` | `services/authService.ts` | `GET /api/v1/auth/me` |
| `updateEvent(id, data)` | `services/adminEventService.ts` | `PUT /api/v1/events/{id}` |
| `cancelEvent(id, reason)` | `services/adminEventService.ts` | `PATCH /api/v1/events/{id}/cancel` |

#### Instancia Axios centralizada
| Archivo | Responsabilidad |
|---------|-----------------|
| `services/apiClient.ts` | Instancia Axios con baseURL, request interceptor (JWT), response interceptors (401 → login, 403 → toast) |

### Arquitectura y Dependencias

- **ms-events**: agregar campo `cancellation_reason` a `Event` o column nullable. Agregar `CANCELLED` a enum de estados.
- **ms-events → RabbitMQ**: publicar `event.cancelled` al cancelar.
- **ms-ticketing**: listener de `event.cancelled` que expire reservas PENDING.
- **ms-notifications**: listener de `event.cancelled` que envíe emails.
- **Frontend**: no requiere nuevas dependencias npm. Solo refactorización de Axios.

### Notas de Implementación

1. **Edición de evento**: reutilizar `EventForm` con prop `mode: 'create' | 'edit'`. Cargar datos existentes con `useEffect` al montar.
2. **Campos inmutables en PUBLISHED**: el backend valida y retorna 400 si se intentan cambiar campos estructurales. El frontend los deshabilita pero la protección real es backend.
3. **Cancelación**: el endpoint `PATCH /cancel` es idempotente. Si el evento ya está CANCELLED retorna 200 con estado actual.
4. **`apiClient.ts`**: crear una instancia `axios.create()` con `baseURL` desde `VITE_API_URL`. Los service files importan esta instancia. El interceptor obtiene el token del `AuthContext` (patrón: setear token global `apiClient.defaults.headers.common` o usar un getter).
5. **Flujo anónimo intacto**: los endpoints de reserva/pago NO requieren JWT. El gateway permite paso sin token a rutas de reserva/checkout.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend

#### HU-ADM-01 — Edición de eventos
- [ ] Implementar `PUT /api/v1/events/{id}` en `EventController` de ms-events
- [ ] Implementar lógica en `EventService`: validar estado, campos editables según estado, aforo vs cupos de tiers
- [ ] Validar que el aforo editado no sea menor a la suma de cupos de tiers existentes
- [ ] Validar campos inmutables para eventos PUBLISHED (rechazar con 400)
- [ ] Actualizar `updated_at` al editar

#### HU-ADM-02 — Cancelación de eventos
- [ ] Agregar estado `CANCELLED` al enum/validación de estados de `Event`
- [ ] Agregar campo `cancellation_reason` (VARCHAR nullable) a entidad `Event`
- [ ] Crear migration Flyway para agregar columna `cancellation_reason`
- [ ] Implementar `PATCH /api/v1/events/{id}/cancel` en `EventController`
- [ ] Validar que solo eventos PUBLISHED pueden cancelarse
- [ ] Publicar evento RabbitMQ `event.cancelled` al cancelar
- [ ] Excluir eventos CANCELLED del listado público `GET /api/v1/events`
- [ ] En ms-ticketing: implementar listener `event.cancelled` que expire reservas PENDING del evento
- [ ] En ms-notifications: implementar listener `event.cancelled` que envíe notificación a compradores afectados

#### HU-SEC-03 — Login opcional de compradores (backend)
- [ ] Implementar `POST /api/v1/auth/register/buyer` — registro público de compradores
- [ ] Validar unicidad de email con constraint de BD
- [ ] Validar contraseña: mínimo 8 caracteres, 1 mayúscula, 1 número
- [ ] Generar JWT con role `BUYER` al registrarse
- [ ] Verificar que `POST /api/v1/auth/login` es compatible con ambos roles (ADMIN, BUYER)
- [ ] Si hay JWT con role BUYER, usar `userId` del token como `buyerId` en la reserva (coordinar con ms-ticketing)
- [ ] Implementar `GET /api/v1/auth/me` para obtener perfil del usuario autenticado
- [ ] Mantener flujo anónimo: si no hay header `Authorization`, aceptar `buyerEmail` en body de reserva

#### Tests Backend
- [ ] Test: PUT /api/v1/events/{id} actualiza evento DRAFT correctamente
- [ ] Test: PUT /api/v1/events/{id} rechaza campos estructurales en evento PUBLISHED
- [ ] Test: PUT /api/v1/events/{id} rechaza aforo menor a cupos de tiers
- [ ] Test: PATCH /api/v1/events/{id}/cancel cambia estado a CANCELLED
- [ ] Test: PATCH /api/v1/events/{id}/cancel publica evento RabbitMQ
- [ ] Test: solo eventos PUBLISHED pueden cancelarse
- [ ] Test: registro de comprador genera JWT con role BUYER
- [ ] Test: registro con email duplicado retorna 409
- [ ] Test: login funciona para ADMIN y BUYER
- [ ] Test: GET /api/v1/auth/me retorna perfil correcto
- [ ] Test: BUYER no puede acceder a endpoints admin (403)

### Frontend

#### HU-SEC-07 — Interceptores Axios centralizados
- [ ] Crear instancia Axios centralizada en `services/apiClient.ts`
- [ ] Implementar request interceptor que inyecta `Authorization: Bearer <token>`
- [ ] Implementar response interceptor para 401 → limpiar sesión + redirect a login
- [ ] Implementar response interceptor para 403 → toast de "Acceso denegado"
- [ ] Refactorizar todos los service files para usar la instancia centralizada
- [ ] Eliminar manejo manual de headers en `adminEventService.ts` y demás

#### HU-ADM-01 — Edición de eventos (frontend)
- [ ] Reutilizar `EventForm` en modo edición (cargar datos existentes)
- [ ] Crear ruta `/admin/events/:id/edit` y página `EditEventPage`
- [ ] Agregar botón "Editar" en `EventDetailAdmin`
- [ ] Deshabilitar campos no editables según estado del evento
- [ ] Agregar función `updateEvent(id, data)` en `adminEventService.ts`

#### HU-ADM-02 — Cancelación de eventos (frontend)
- [ ] Agregar botón "Cancelar Evento" en `EventDetailAdmin` (solo para PUBLISHED)
- [ ] Crear `CancelEventModal` con campo de motivo obligatorio
- [ ] Mostrar estado CANCELLED con badge rojo en dashboard
- [ ] Agregar función `cancelEvent(id, reason)` en `adminEventService.ts`

#### HU-SEC-06 — Login y registro de compradores (frontend)
- [ ] Crear página `/login` para compradores (`BuyerLoginPage`)
- [ ] Crear página `/registro` con formulario de registro (`BuyerRegisterPage`)
- [ ] Agregar botón "Iniciar Sesión" / "Registrarse" en `NavBar` (solo si no autenticado)
- [ ] Mostrar nombre/email del usuario autenticado en `NavBar` con menú desplegable
- [ ] Pre-llenar email en checkout si usuario está autenticado
- [ ] Crear ruta `/mis-tickets` que filtre por userId del comprador autenticado
- [ ] Agregar función `registerBuyer(email, password)` en `authService.ts`
- [ ] Mantener flujo de compra anónima sin cambios

#### Tests Frontend
- [ ] Test: interceptor inyecta token en requests autenticadas
- [ ] Test: interceptor redirige a login en 401
- [ ] Test: interceptor muestra toast en 403
- [ ] Test: EventForm en modo edición carga datos correctamente
- [ ] Test: campos deshabilitados en evento PUBLISHED
- [ ] Test: CancelEventModal envía motivo obligatorio
- [ ] Test: registro de comprador crea cuenta y autentica
- [ ] Test: compra anónima funciona sin cambios
- [ ] Test: email pre-llenado en checkout para usuario autenticado

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios ADM1.1–ADM1.3, ADM2.1–ADM2.3, 3.1–3.4, 6.1–6.4, 7.1–7.3
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar que flujo de compra anónima sigue funcionando end-to-end
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
