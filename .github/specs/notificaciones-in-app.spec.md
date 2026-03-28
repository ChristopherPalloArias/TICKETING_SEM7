---
id: SPEC-017
status: APPROVED
feature: notificaciones-in-app
created: 2026-03-28
updated: 2026-03-28
author: spec-generator
version: "1.1"
related-specs: [SPEC-005, SPEC-006, SPEC-007, SPEC-010]
---

# Spec: Notificaciones In-App en Tiempo Real

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Conectar el frontend con `ms-notifications` mediante polling periódico para que las notificaciones persistentes del backend (pago fallido, reserva expirada) sean visibles en el panel de notificaciones existente (`NotificationsPanel`). Actualmente las notificaciones del backend se persisten en PostgreSQL pero nunca llegan al usuario; el frontend solo maneja notificaciones locales efímeras que se pierden al recargar. Este feature unifica ambas fuentes de datos, agrega soporte de lecturas/no-leídas sincronizadas con el servidor, y enriquece los eventos RabbitMQ con el nombre del evento (obra de teatro).

### Requerimiento de Negocio
El requerimiento original se encuentra en `.github/requirements/notificaciones-in-app.md`. Resume el problema:

```
ms-ticketing  ──RabbitMQ──►  ms-notifications (DB)  ──✖──►  Frontend (local state)
```

El comprador no se entera de pagos rechazados ni reservas expiradas por el backend si recarga la página o si la expiración ocurre fuera de su sesión. La solución propuesta es polling HTTP periódico (30s) al endpoint `GET /api/v1/notifications/buyer/{buyerId}` a través del `api-gateway`, unificando notificaciones locales y del backend sin duplicados.

**Capas afectadas:** `api-gateway`, `ms-notifications`, `ms-ticketing`, `frontend/`
**Depende de:** SPEC-005 (pago simulado), SPEC-006 (expiración), SPEC-007 (consumo eventos RabbitMQ)

### Historias de Usuario

#### HU-NTF-01: Exposición de ruta de notificaciones en API Gateway

```
Como:        Frontend
Quiero:      que el API Gateway enrute las peticiones /api/v1/notifications/** hacia ms-notifications
Para:        poder consultar las notificaciones persistentes del backend desde el navegador

Prioridad:   Alta (bloqueante para las demás HUs)
Estimación:  S (2 SP)
Dependencias: Ninguna
Capa:        Backend (api-gateway)
```

#### Criterios de Aceptación — HU-NTF-01

**Happy Path**
```gherkin
CRITERIO-NTF-1.1: Proxy de peticiones de notificaciones
  Dado que:  el API Gateway está en ejecución y ms-notifications está disponible en el puerto configurado
  Cuando:    el frontend envía GET /api/v1/notifications/buyer/{buyerId}
  Entonces:  el gateway redirige la petición a ms-notifications y la respuesta se retorna al cliente con status 200
```

```gherkin
CRITERIO-NTF-1.2: Proxy de PATCH read-all a través del gateway
  Dado que:  el API Gateway está en ejecución
  Cuando:    el frontend envía PATCH /api/v1/notifications/buyer/{buyerId}/read-all
  Entonces:  el gateway redirige la petición a ms-notifications y retorna status 200
```

```gherkin
CRITERIO-NTF-1.5: Proxy de PATCH archive-all a través del gateway
  Dado que:  el API Gateway está en ejecución
  Cuando:    el frontend envía PATCH /api/v1/notifications/buyer/{buyerId}/archive-all
  Entonces:  el gateway redirige la petición a ms-notifications y retorna status 200
```

**Happy Path — Headers**
```gherkin
CRITERIO-NTF-1.3: Header de usuario propagado al microservicio
  Dado que:  el frontend envía una petición con header X-User-Id
  Cuando:    el API Gateway redirige la petición a ms-notifications
  Entonces:  el header X-User-Id está presente en la petición recibida por ms-notifications
```

**Error Path**
```gherkin
CRITERIO-NTF-1.4: Ruta inexistente en notificaciones
  Dado que:  el API Gateway está en ejecución
  Cuando:    el frontend envía GET /api/v1/notifications/invalid-path
  Entonces:  el gateway retorna 404
```

---

#### HU-NTF-02: Endpoint de marcar notificaciones como leídas

```
Como:        Comprador
Quiero:      que al abrir el panel de notificaciones las notificaciones se marquen como leídas en el servidor
Para:        que el contador de no leídas sea consistente entre sesiones y dispositivos

Prioridad:   Alta
Estimación:  M (3 SP)
Dependencias: HU-NTF-01
Capa:        Backend (ms-notifications)
```

#### Criterios de Aceptación — HU-NTF-02

**Happy Path**
```gherkin
CRITERIO-NTF-2.1: Notificación creada con estado no leída y no archivada
  Dado que:  ms-notifications recibe un evento RabbitMQ (pago fallido o reserva expirada)
  Cuando:    crea la notificación en la base de datos
  Entonces:  el campo "read" tiene valor false por defecto
  Y:         el campo "archived" tiene valor false por defecto
```

```gherkin
CRITERIO-NTF-2.2: Marcar todas las notificaciones como leídas
  Dado que:  el comprador tiene 3 notificaciones con read = false
  Cuando:    el frontend envía PATCH /api/v1/notifications/buyer/{buyerId}/read-all
  Entonces:  todas las notificaciones del comprador se actualizan a read = true
  Y:         la respuesta tiene status 200 con el conteo de notificaciones actualizadas
```

```gherkin
CRITERIO-NTF-2.3: Obtener cantidad de no leídas
  Dado que:  el comprador tiene 5 notificaciones, 3 con read = false
  Cuando:    el frontend envía GET /api/v1/notifications/buyer/{buyerId}/unread-count
  Entonces:  la respuesta contiene { "unreadCount": 3 }
```

**Edge Case**
```gherkin
CRITERIO-NTF-2.4: Idempotencia de mark-all-read
  Dado que:  todas las notificaciones del comprador ya tienen read = true
  Cuando:    el frontend envía PATCH /api/v1/notifications/buyer/{buyerId}/read-all
  Entonces:  la respuesta tiene status 200 con { "updatedCount": 0 }
```

```gherkin
CRITERIO-NTF-2.5: Unread-count sin notificaciones
  Dado que:  el comprador no tiene notificaciones
  Cuando:    el frontend envía GET /api/v1/notifications/buyer/{buyerId}/unread-count
  Entonces:  la respuesta contiene { "unreadCount": 0 }
```

```gherkin
CRITERIO-NTF-2.6: Archivar todas las notificaciones del comprador
  Dado que:  el comprador tiene 4 notificaciones visibles (archived = false)
  Cuando:    el frontend envía PATCH /api/v1/notifications/buyer/{buyerId}/archive-all
  Entonces:  todas las notificaciones del comprador se actualizan a archived = true
  Y:         la respuesta tiene status 200 con { "archivedCount": 4 }
```

```gherkin
CRITERIO-NTF-2.7: Listado excluye notificaciones archivadas
  Dado que:  el comprador tiene 3 notificaciones archivadas y 2 no archivadas
  Cuando:    el frontend envía GET /api/v1/notifications/buyer/{buyerId}
  Entonces:  la respuesta solo contiene las 2 notificaciones con archived = false
```

```gherkin
CRITERIO-NTF-2.8: Idempotencia de archive-all
  Dado que:  todas las notificaciones del comprador ya tienen archived = true
  Cuando:    el frontend envía PATCH /api/v1/notifications/buyer/{buyerId}/archive-all
  Entonces:  la respuesta tiene status 200 con { "archivedCount": 0 }
```

```gherkin
CRITERIO-NTF-2.9: Unread-count excluye notificaciones archivadas
  Dado que:  el comprador tiene 3 notificaciones no leídas, 1 de ellas archivada
  Cuando:    el frontend envía GET /api/v1/notifications/buyer/{buyerId}/unread-count
  Entonces:  la respuesta contiene { "unreadCount": 2 } (solo no-archivadas)
```

---

#### HU-NTF-03: Servicio frontend para consultar notificaciones del backend

```
Como:        Frontend
Quiero:      un servicio que consulte periódicamente las notificaciones del comprador desde ms-notifications
Para:        mantener la lista de notificaciones sincronizada con el servidor sin requerir WebSocket

Prioridad:   Alta
Estimación:  M (3 SP)
Dependencias: HU-NTF-01, HU-NTF-02
Capa:        Frontend
```

#### Criterios de Aceptación — HU-NTF-03

**Happy Path**
```gherkin
CRITERIO-NTF-3.1: Consulta de notificaciones del comprador
  Dado que:  el servicio de notificaciones está configurado
  Cuando:    se invoca fetchNotifications(buyerId)
  Entonces:  se envía GET /api/v1/notifications/buyer/{buyerId}?page=0&size=20 con header X-User-Id
  Y:         se retorna la lista de notificaciones mapeadas al tipo AppNotification del frontend
```

```gherkin
CRITERIO-NTF-3.2: Polling automático cada 30 segundos
  Dado que:  el comprador está en cualquier pantalla de la aplicación
  Cuando:    han transcurrido 30 segundos desde la última consulta
  Entonces:  el frontend consulta automáticamente las notificaciones del backend
  Y:         actualiza la lista sin duplicar notificaciones ya existentes
```

```gherkin
CRITERIO-NTF-3.3: Badge del ícono refleja el backend
  Dado que:  el comprador tiene 2 notificaciones no leídas en el servidor
  Cuando:    el frontend realiza el polling
  Entonces:  el badge rojo del ícono de campana muestra "2"
```

**Edge Case**
```gherkin
CRITERIO-NTF-3.4: Polling pausado durante checkout/pago
  Dado que:  el comprador está en la pantalla de checkout, pago o fallo
  Cuando:    el timer transaccional está activo
  Entonces:  el polling de notificaciones se pausa
  Y:         se reanuda al salir del flujo transaccional
```

```gherkin
CRITERIO-NTF-3.5: Error de red no rompe el polling
  Dado que:  el backend no responde temporalmente
  Cuando:    el polling intenta consultar
  Entonces:  el error se captura silenciosamente (log en consola)
  Y:         el próximo ciclo de polling se ejecuta normalmente
```

---

#### HU-NTF-04: Visualización unificada de notificaciones en el panel

```
Como:        Comprador
Quiero:      ver en el panel tanto las notificaciones locales como las persistentes del backend
Para:        tener una vista completa de todos los eventos relevantes sin importar si recargué la página

Prioridad:   Alta
Estimación:  L (5 SP)
Dependencias: HU-NTF-02, HU-NTF-03
Capa:        Frontend
```

#### Criterios de Aceptación — HU-NTF-04

**Happy Path**
```gherkin
CRITERIO-NTF-4.1: Panel muestra notificaciones del servidor
  Dado que:  el comprador tiene 2 notificaciones de pago fallido en el backend y no tiene notificaciones locales
  Cuando:    abre el panel de notificaciones (clic en ícono campana)
  Entonces:  el panel muestra las 2 notificaciones con ícono XCircle y fondo rojo
  Y:         cada notificación muestra el título, mensaje y tiempo relativo
```

```gherkin
CRITERIO-NTF-4.2: Merge sin duplicados
  Dado que:  el comprador tiene 1 notificación local "payment_rejected" para reserva "R-001"
  Y:         el backend tiene 1 notificación "PAYMENT_FAILED" para la misma reserva "R-001"
  Cuando:    el frontend realiza el polling y renderiza el panel
  Entonces:  se muestra solo 1 notificación (sin duplicados)
  Y:         la lista está ordenada por timestamp descendente
```

```gherkin
CRITERIO-NTF-4.3: Persistencia entre recargas
  Dado que:  el comprador recibió una notificación de reserva expirada
  Cuando:    recarga la página (F5) y el polling se ejecuta
  Entonces:  la notificación aparece en el panel y el badge refleja el conteo de no leídas
```

```gherkin
CRITERIO-NTF-4.4: Expiración detectada por backend sin sesión activa
  Dado que:  el comprador creó una reserva y cerró el navegador
  Y:         el backend expiró la reserva automáticamente (ExpirationService cada 60s)
  Cuando:    el comprador vuelve a abrir la aplicación y el polling obtiene las notificaciones
  Entonces:  el panel muestra "Tiempo agotado" con el nombre del evento
  Y:         el badge indica 1 notificación no leída
```

```gherkin
CRITERIO-NTF-4.5: Apertura del panel marca como leídas en el servidor
  Dado que:  el comprador tiene 3 notificaciones no leídas
  Cuando:    abre el panel de notificaciones
  Entonces:  el frontend llama a PATCH /api/v1/notifications/buyer/{buyerId}/read-all
  Y:         el badge se actualiza a 0
  Y:         al cerrar y reabrir el panel las notificaciones siguen marcadas como leídas
```

```gherkin
CRITERIO-NTF-4.7: Botón "Limpiar todo" archiva notificaciones en el servidor
  Dado que:  el comprador tiene 3 notificaciones visibles en el panel
  Cuando:    hace clic en el botón "Limpiar todo" (ícono Trash2)
  Entonces:  las notificaciones desaparecen inmediatamente del panel (optimistic update)
  Y:         el frontend llama a PATCH /api/v1/notifications/buyer/{buyerId}/archive-all
  Y:         el badge se actualiza a 0
  Y:         al recargar la página las notificaciones archivadas no reaparecen
```

```gherkin
CRITERIO-NTF-4.8: Nuevas notificaciones visibles tras archivar
  Dado que:  el comprador archivó todas sus notificaciones
  Y:         el backend genera una nueva notificación (pago fallido)
  Cuando:    el polling obtiene las notificaciones
  Entonces:  la nueva notificación aparece en el panel (archived = false)
  Y:         las notificaciones archivadas previamente no reaparecen
```

**Edge Case**
```gherkin
CRITERIO-NTF-4.6: Estilos diferenciados por tipo de notificación
  Dado que:  el panel contiene notificaciones de tipos diferentes
  Cuando:    el comprador visualiza el listado
  Entonces:  las de pago rechazado muestran ícono XCircle con acento rojo
  Y:         las de reserva expirada muestran ícono Timer con acento verde/ámbar
  Y:         cada notificación muestra el nombre del evento asociado
```

---

#### HU-NTF-05: Enriquecimiento del evento de notificación con nombre del evento

```
Como:        Comprador
Quiero:      que las notificaciones incluyan el nombre del evento (obra de teatro)
Para:        entender de inmediato a qué compra se refiere la notificación

Prioridad:   Media
Estimación:  M (3 SP)
Dependencias: Ninguna (puede ejecutarse en paralelo)
Capa:        Backend (ms-ticketing + ms-notifications)
```

#### Criterios de Aceptación — HU-NTF-05

**Happy Path**
```gherkin
CRITERIO-NTF-5.1: TicketPaymentFailedEvent contiene eventName
  Dado que:  un pago es rechazado para una reserva del evento "Hamlet en el Noir"
  Cuando:    ms-ticketing publica el TicketPaymentFailedEvent
  Entonces:  el payload incluye el campo eventName con valor "Hamlet en el Noir"
```

```gherkin
CRITERIO-NTF-5.2: TicketExpiredEvent contiene eventName
  Dado que:  una reserva del evento "Romeo y Julieta" expira
  Cuando:    ms-ticketing publica el TicketExpiredEvent
  Entonces:  el payload incluye el campo eventName con valor "Romeo y Julieta"
```

```gherkin
CRITERIO-NTF-5.3: Notificación persistida con eventName
  Dado que:  ms-notifications consume un evento con eventName = "Hamlet en el Noir"
  Cuando:    crea la notificación en la base de datos
  Entonces:  la notificación tiene el campo eventName = "Hamlet en el Noir"
```

```gherkin
CRITERIO-NTF-5.4: API retorna eventName
  Dado que:  el comprador consulta sus notificaciones
  Cuando:    el frontend llama a GET /api/v1/notifications/buyer/{buyerId}
  Entonces:  cada notificación en la respuesta incluye el campo eventName
```

**Edge Case**
```gherkin
CRITERIO-NTF-5.5: Backward compatibility — eventName ausente
  Dado que:  ms-notifications consume un evento publicado antes de este cambio (sin campo eventName)
  Cuando:    crea la notificación en la base de datos
  Entonces:  el campo eventName se almacena como null
  Y:         la API retorna eventName = null (no falla)
```

### Reglas de Negocio

1. **RN-NTF-01 — Campo `read` default**: Toda notificación nueva se crea con `read = false`.
2. **RN-NTF-02 — Deduplicación backend**: Se mantiene la constraint única existente `(reservation_id, type)` en la tabla `notification`. No se duplican notificaciones por la misma reserva y tipo.
3. **RN-NTF-03 — Deduplicación frontend**: Las notificaciones locales y del backend se deduplican por `reservationId + type` antes del merge. La versión del backend prevalece sobre la local.
4. **RN-NTF-04 — Orden**: Las notificaciones se muestran ordenadas por timestamp descendente (más reciente primero).
5. **RN-NTF-05 — Polling interval**: 30 segundos. Se pausa en pantallas transaccionales (`checkout`, `payment`, `failure`).
6. **RN-NTF-06 — Prioridad de notificaciones**: Se mantiene la regla existente: si `PAYMENT_SUCCESS` existe para una reserva, se omite `RESERVATION_EXPIRED`.
7. **RN-NTF-07 — eventName nullable**: El campo `eventName` es nullable para compatibilidad con eventos RabbitMQ publicados antes de HU-NTF-05. El frontend debe mostrar fallback "Evento" si es null.
8. **RN-NTF-08 — Mark-all-read scope**: `PATCH /read-all` solo actualiza notificaciones del `buyerId` indicado. No afecta notificaciones de otros compradores.
9. **RN-NTF-09 — Auto-ocultación local (optimistic update)**: Cuando el usuario hace clic en "Limpiar todo", el frontend limpia su estado local inmediatamente mientras se procesa la petición `archive-all` al backend. Si la petición falla, se restaura el estado anterior.
10. **RN-NTF-10 — Filtrado por archived en backend**: El endpoint `GET /buyer/{buyerId}` solo devuelve notificaciones con `archived = false`. El frontend no necesita lógica de filtrado adicional; el backend es la fuente de verdad.
11. **RN-NTF-11 — Archive-all scope**: `PATCH /archive-all` solo archiva notificaciones del `buyerId` indicado. No afecta notificaciones de otros compradores.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Notification` | tabla `notification` (ms-notifications PostgreSQL) | **modificada** — campos `read`, `event_name`, `archived` | Notificación persistente de eventos de dominio |
| `TicketPaymentFailedEvent` | DTO en ms-ticketing y ms-notifications | **modificada** — campo `eventName` | Evento RabbitMQ de pago fallido |
| `TicketExpiredEvent` | DTO en ms-ticketing y ms-notifications | **modificada** — campo `eventName` | Evento RabbitMQ de reserva expirada |
| `TicketPaidEvent` | DTO en ms-ticketing y ms-notifications | **modificada** — campo `eventName` | Evento RabbitMQ de pago exitoso (consistencia) |

#### Campos del modelo — Notification (cambios)
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `id` | UUID | sí | auto-generado | PK existente |
| `reservation_id` | UUID | sí | — | FK existente |
| `event_id` | UUID | sí | — | ID del evento existente |
| `tier_id` | UUID | sí | — | ID del tier existente |
| `buyer_id` | UUID | sí | — | ID del comprador existente |
| `type` | VARCHAR(50) ENUM | sí | `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `RESERVATION_EXPIRED` | Tipo existente |
| `motif` | VARCHAR(255) | sí | max 255 chars | Motivo existente |
| `status` | VARCHAR(20) ENUM | sí | `PROCESSED`, `FAILED` | Estado existente |
| **`read`** | **BOOLEAN** | **sí** | **default `false`** | **NUEVO — indica si fue leída por el comprador** |
| **`archived`** | **BOOLEAN** | **sí** | **default `false`** | **NUEVO — si true, la notificación no se envía al frontend** |
| **`event_name`** | **VARCHAR(255)** | **no** | **nullable** | **NUEVO — nombre del evento (obra de teatro)** |
| `created_at` | TIMESTAMP (UTC) | sí | auto-generado | Existente |

#### Campos nuevos en DTOs de eventos RabbitMQ
| DTO | Campo nuevo | Tipo | Nullable | Descripción |
|-----|------------|------|----------|-------------|
| `TicketPaymentFailedEvent` | `eventName` | String | sí | Nombre del evento |
| `TicketExpiredEvent` | `eventName` | String | sí | Nombre del evento |
| `TicketPaidEvent` | `eventName` | String | sí | Nombre del evento (consistencia) |

#### Índices / Constraints
| Índice | Columnas | Justificación |
|--------|----------|---------------|
| `uq_notification_reservation_type` | `(reservation_id, type)` | **Ya existe** — deduplicación |
| **`idx_notification_buyer_archived_read`** | **`(buyer_id, is_archived, is_read)`** | **NUEVO** — índice compuesto que optimiza listado (filtro archived), `countUnreadByBuyerId`, `markAllReadByBuyerId` y `archiveAllByBuyerId` |

### API Endpoints

#### GET /api/v1/notifications/buyer/{buyerId} (YA EXISTE)
- **Descripción**: Lista notificaciones **no archivadas** del comprador (paginado, orden descendente por `created_at`)
- **Auth requerida**: header `X-User-Id`
- **Path Params**: `buyerId` (UUID)
- **Query Params**: `page` (int, default 0), `size` (int, default 20, max 100)
- **Filtro implícito**: `archived = false` (siempre aplicado, no expuesto como query param)
- **Response 200**:
  ```json
  {
    "content": [
      {
        "id": "uuid",
        "reservationId": "uuid",
        "eventId": "uuid",
        "tierId": "uuid",
        "buyerId": "uuid",
        "type": "PAYMENT_FAILED",
        "motif": "Pago rechazado por la pasarela",
        "status": "PROCESSED",
        "read": false,
        "archived": false,
        "eventName": "Hamlet en el Noir",
        "createdAt": "2026-03-28T10:30:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1
  }
  ```
- **Response 400**: `buyerId` no es UUID válido
- **Cambios**: El `NotificationResponse` ahora incluye campos `read`, `archived` y `eventName`. El query filtra `archived = false`.

#### PATCH /api/v1/notifications/buyer/{buyerId}/read-all (NUEVO)
- **Descripción**: Marca todas las notificaciones del comprador como leídas
- **Auth requerida**: header `X-User-Id`
- **Path Params**: `buyerId` (UUID)
- **Request Body**: ninguno
- **Response 200**:
  ```json
  {
    "updatedCount": 3
  }
  ```
- **Response 400**: `buyerId` no es UUID válido

#### GET /api/v1/notifications/buyer/{buyerId}/unread-count (NUEVO)
- **Descripción**: Retorna el conteo de notificaciones no leídas del comprador
- **Auth requerida**: header `X-User-Id`
- **Path Params**: `buyerId` (UUID)
- **Response 200**:
  ```json
  {
    "unreadCount": 3
  }
  ```
- **Response 400**: `buyerId` no es UUID válido

#### PATCH /api/v1/notifications/buyer/{buyerId}/archive-all (NUEVO)
- **Descripción**: Marca todas las notificaciones no archivadas del comprador como archivadas
- **Auth requerida**: header `X-User-Id`
- **Path Params**: `buyerId` (UUID)
- **Request Body**: ninguno
- **Response 200**:
  ```json
  {
    "archivedCount": 4
  }
  ```
- **Response 400**: `buyerId` no es UUID válido
- **Nota**: Solo afecta notificaciones con `archived = false`. Idempotente (si todas ya archivadas, retorna `archivedCount: 0`).

### Configuración API Gateway

#### Ruta nueva en `application.yml`
```yaml
# ms-notifications
- id: ms-notifications
  uri: ${MS_NOTIFICATIONS_URL:http://ms-notifications:8083}
  predicates:
    - Path=/api/v1/notifications/**
  filters:
    - StripPrefix=0
```

Se agrega después de la ruta de `ms-ticketing` en el bloque `spring.cloud.gateway.routes`. Los headers `X-User-Id` y `Content-Type` ya se propagan por la configuración CORS global existente (`exposedHeaders: X-Role, X-User-Id`).

### Diseño Frontend

#### Componentes modificados
| Componente | Archivo | Cambios | Descripción |
|------------|---------|---------|-------------|
| `NotificationsPanel` | `components/NavBar/NotificationsPanel.tsx` | Mostrar `eventTitle` del backend, integrar `markAllRead` con servidor | Panel dropdown existente |
| `NotificationsProvider` | `contexts/NotificationsContext.tsx` | Agregar arreglos `localNotifications` + `backendNotifications`, merge, deduplicación, integrar polling | Contexto existente |

#### Páginas nuevas
Ninguna.

#### Hooks y State
| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useNotificationPolling` | `hooks/useNotificationPolling.ts` | `{ backendNotifications, unreadCount, isPolling }` | **NUEVO** — polling cada 30s al backend |

#### Services (llamadas API)
| Función | Archivo | Endpoint |
|---------|---------|----------|
| `fetchNotifications(buyerId)` | `services/notificationService.ts` | `GET /api/v1/notifications/buyer/{buyerId}?page=0&size=20` |
| `markAllRead(buyerId)` | `services/notificationService.ts` | `PATCH /api/v1/notifications/buyer/{buyerId}/read-all` |
| `fetchUnreadCount(buyerId)` | `services/notificationService.ts` | `GET /api/v1/notifications/buyer/{buyerId}/unread-count` |
| `archiveAll(buyerId)` | `services/notificationService.ts` | `PATCH /api/v1/notifications/buyer/{buyerId}/archive-all` |

#### Tipos nuevos
| Tipo | Archivo | Descripción |
|------|---------|-------------|
| `BackendNotification` | `types/notification.ts` | Tipo de respuesta del backend (`id`, `reservationId`, `type`, `read`, `eventName`, `createdAt`, etc.) |
| `PagedNotificationResponse` | `types/notification.ts` | Respuesta paginada (`content`, `page`, `size`, `totalElements`, `totalPages`) |

#### Mapeo de tipos backend → frontend
| Backend `type` | Frontend `NotificationType` | Ícono | Acento |
|----------------|---------------------------|-------|--------|
| `PAYMENT_FAILED` | `payment_rejected` | `XCircle` | rojo |
| `RESERVATION_EXPIRED` | `timer_expired` | `Timer` | verde/ámbar |

#### Lógica de deduplicación
- Clave de deduplicación: `reservationId + type`
- Al recibir notificaciones del backend, se genera un `Set` de claves.
- Las notificaciones locales que coincidan con una clave del backend se descartan (backend prevalece).
- La lista final se ordena por `timestamp` descendente.

### Arquitectura y Dependencias
- **Paquetes nuevos requeridos**: ninguno
- **Servicios externos**: `ms-notifications` accesible desde `api-gateway` (puerto configurable via `MS_NOTIFICATIONS_URL`)
- **Impacto en docker-compose**: agregar variable de entorno `MS_NOTIFICATIONS_URL` al servicio `api-gateway` si no existe
- **Impacto en punto de entrada de la app**: no se requieren cambios en rutas del frontend router

### Notas de Implementación

1. **Campo `read` en entidad `Notification`**: Agregar como `@Column(name = "is_read", nullable = false) @Builder.Default private Boolean read = false;`. Se usa `is_read` como nombre de columna porque `read` es palabra reservada en SQL.

2. **Campo `archived` en entidad `Notification`**: Agregar como `@Column(name = "is_archived", nullable = false) @Builder.Default private Boolean archived = false;`. Se usa `is_archived` como nombre de columna para consistencia con `is_read`.

3. **Campo `event_name` en entidad `Notification`**: Agregar como `@Column(name = "event_name", length = 255) private String eventName;`. Nullable, sin default.

4. **Obtener eventName en ms-ticketing**: La entidad `Reservation` no tiene `eventName`. Se debe obtener del servicio `ms-events` usando `eventId`. El `MsEventsIntegrationService` ya existe en ms-ticketing y se usa en `ReservationExpirationProcessor`. Reutilizar `getEventDetail(UUID eventId)` que ya consulta `GET /api/v1/events/{eventId}` y extraer el nombre del `EventDetailResponse`. Si la llamada falla, se envía `eventName = null` (graceful degradation).

5. **Actualizar NotificationResponse DTO**: Agregar campos `read` (boolean), `archived` (boolean) y `eventName` (String) al record `NotificationResponse`.

6. **Polling en frontend**: Usar `useEffect` + `setInterval` con limpieza. El `enabled` flag se controla desde el contexto considerando la pantalla actual (no polling en `checkout`, `payment`, `failure`).

7. **Mark-all-read**: Implementar como `@Modifying @Query("UPDATE Notification n SET n.read = true WHERE n.buyerId = :buyerId AND n.read = false AND n.archived = false")` en el repository. Retornar `int` (count de actualizados). Solo afecta notificaciones no archivadas.

8. **Archive-all**: Implementar como `@Modifying @Query("UPDATE Notification n SET n.archived = true WHERE n.buyerId = :buyerId AND n.archived = false")` en el repository. Retornar `int` (count de archivados).

9. **Queries filtrados por archived**: Actualizar `findByBuyerId` a `findByBuyerIdAndArchivedFalse`. Actualizar `countUnreadByBuyerId` a filtrar `AND archived = false`.

10. **Ciclo de vida de una notificación**: `CREATED (read=false, archived=false)` → `READ (read=true, archived=false)` → `ARCHIVED (archived=true)`. Una notificación archivada no aparece en listados ni en conteos de no leídas.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### API Gateway (HU-NTF-01)
- [ ] Agregar ruta `/api/v1/notifications/**` en `api-gateway/src/main/resources/application.yml` apuntando a `ms-notifications`
- [ ] Verificar propagación de headers `X-User-Id` y `Content-Type`
- [ ] Validar que CORS permite `PATCH` method (ya listado en config global)
- [ ] Agregar variable `MS_NOTIFICATIONS_URL` en `docker-compose.yml` para el servicio `api-gateway` si no existe

#### ms-notifications — Modelo y esquema (HU-NTF-02)
- [ ] Agregar campo `read` (Boolean, default false, column `is_read`) a entidad `Notification`
- [ ] Agregar campo `archived` (Boolean, default false, column `is_archived`) a entidad `Notification`
- [ ] Agregar campo `eventName` (String, nullable, column `event_name`) a entidad `Notification`
- [ ] Crear migración Flyway `V2__add_read_archived_eventname.sql` con columnas `is_read`, `is_archived`, `event_name` e índice compuesto
- [ ] Agregar índice `idx_notification_buyer_archived_read` sobre `(buyer_id, is_archived, is_read)`
- [ ] Actualizar `NotificationResponse` DTO: agregar campos `read`, `archived` y `eventName`
- [ ] Actualizar método `toResponse()` en `NotificationService` para incluir `read`, `archived` y `eventName`

#### ms-notifications — Endpoints nuevos (HU-NTF-02)
- [ ] Implementar `PATCH /api/v1/notifications/buyer/{buyerId}/read-all` en `NotificationController`
- [ ] Implementar `GET /api/v1/notifications/buyer/{buyerId}/unread-count` en `NotificationController`
- [ ] Agregar método `markAllReadByBuyerId(UUID buyerId)` en `NotificationService` — retorna `int`
- [ ] Agregar método `countUnreadByBuyerId(UUID buyerId)` en `NotificationService` — retorna `long`
- [ ] Agregar query `@Modifying UPDATE ... SET read=true WHERE buyerId=:buyerId AND read=false` en `NotificationRepository`
- [ ] Agregar query `countByBuyerIdAndArchivedFalseAndReadFalse(UUID buyerId)` en `NotificationRepository`
- [ ] Crear DTO `MarkAllReadResponse(int updatedCount)` y `UnreadCountResponse(long unreadCount)`

#### ms-notifications — Endpoint archive-all (HU-NTF-02)
- [ ] Implementar `PATCH /api/v1/notifications/buyer/{buyerId}/archive-all` en `NotificationController`
- [ ] Agregar método `archiveAllByBuyerId(UUID buyerId)` en `NotificationService` — retorna `int`
- [ ] Agregar query `@Modifying UPDATE ... SET archived=true WHERE buyerId=:buyerId AND archived=false` en `NotificationRepository`
- [ ] Crear DTO `ArchiveAllResponse(int archivedCount)`
- [ ] Actualizar `findByBuyerId` en `NotificationRepository` para filtrar `archived = false`
- [ ] Actualizar `countUnreadByBuyerId` para filtrar `archived = false`
- [ ] Actualizar `markAllReadByBuyerId` para filtrar `archived = false`

#### ms-notifications — Consumers (HU-NTF-05)
- [ ] Agregar campo `eventName` al DTO `TicketPaymentFailedEvent` en ms-notifications
- [ ] Agregar campo `eventName` al DTO `TicketExpiredEvent` en ms-notifications
- [ ] Agregar campo `eventName` al DTO `TicketPaidEvent` en ms-notifications (consistencia)
- [ ] Actualizar `TicketPaymentFailedConsumer` para persistir `eventName`
- [ ] Actualizar `TicketExpiredConsumer` para persistir `eventName`
- [ ] Actualizar `TicketPaidConsumer` para persistir `eventName`
- [ ] Actualizar `NotificationService.createIfNotExists()` para recibir y persistir `eventName`

#### ms-ticketing — Publishers (HU-NTF-05)
- [ ] Agregar campo `eventName` al DTO `TicketPaymentFailedEvent` en ms-ticketing
- [ ] Agregar campo `eventName` al DTO `TicketExpiredEvent` en ms-ticketing
- [ ] Agregar campo `eventName` al DTO `TicketPaidEvent` en ms-ticketing (consistencia)
- [ ] Agregar método `getEventName(UUID eventId)` en `MsEventsIntegrationService` (o reutilizar existente)
- [ ] Actualizar `ReservationExpirationProcessor.expireSingle()` para obtener eventName y pasarlo al evento
- [ ] Actualizar publishers de `TicketPaymentFailedEvent` para incluir eventName
- [ ] Actualizar publisher de `TicketPaidEvent` para incluir eventName

#### Tests Backend
- [ ] `test_notification_created_with_read_false` — campo read default
- [ ] `test_mark_all_read_updates_only_buyer_notifications` — scope correcto
- [ ] `test_mark_all_read_returns_updated_count` — conteo correcto
- [ ] `test_mark_all_read_idempotent` — sin error si ya leídas
- [ ] `test_unread_count_returns_correct_value` — conteo de no leídas
- [ ] `test_unread_count_zero_when_no_notifications` — edge case vacío
- [ ] `test_notification_response_includes_read_and_eventName` — DTO actualizado
- [ ] `test_consumer_persists_eventName` — campo eventName del evento RabbitMQ
- [ ] `test_consumer_handles_null_eventName` — backward compatibility
- [ ] `test_notification_created_with_archived_false` — campo archived default
- [ ] `test_archive_all_updates_only_buyer_notifications` — scope correcto
- [ ] `test_archive_all_returns_archived_count` — conteo correcto
- [ ] `test_archive_all_idempotent` — sin error si ya archivadas
- [ ] `test_find_by_buyer_excludes_archived` — listado filtra archived=false
- [ ] `test_unread_count_excludes_archived` — conteo excluye archivadas
- [ ] `test_mark_all_read_excludes_archived` — read-all no afecta archivadas
- [ ] `test_gateway_proxies_notifications_route` — ruta en gateway
- [ ] `test_patch_read_all_through_gateway` — PATCH a través del gateway
- [ ] `test_patch_archive_all_through_gateway` — PATCH archive-all a través del gateway

### Frontend

#### Implementación
- [ ] Crear `services/notificationService.ts` — funciones `fetchNotifications`, `markAllRead`, `fetchUnreadCount`, `archiveAll`
- [ ] Crear `types/notification.ts` — tipos `BackendNotification`, `PagedNotificationResponse`
- [ ] Crear `hooks/useNotificationPolling.ts` — hook con `setInterval` 30s, flag `enabled`
- [ ] Refactorizar `NotificationsContext.tsx` — agregar `localNotifications` + `backendNotifications`, merge, deduplicación
- [ ] Integrar `useNotificationPolling` en `NotificationsProvider`
- [ ] Implementar mapeo de tipos: `PAYMENT_FAILED` → `payment_rejected`, `RESERVATION_EXPIRED` → `timer_expired`
- [ ] Implementar función de deduplicación por `reservationId + type`
- [ ] Actualizar `markAllRead()` en contexto para llamar a `PATCH /read-all` del backend
- [ ] Actualizar `clearAll()` en contexto para llamar a `PATCH /archive-all` del backend con optimistic update
- [ ] Actualizar `NotificationsPanel.tsx` para mostrar `eventName` (de backend) o fallback "Evento"
- [ ] Conectar botón `Trash2` existente en `NotificationsPanel` a `archiveAll()` del backend
- [ ] Controlar pausa de polling en pantallas transaccionales (`checkout`, `payment`, `failure`)

#### Tests Frontend
- [ ] `notificationService fetchNotifications calls correct endpoint`
- [ ] `notificationService markAllRead sends PATCH request`
- [ ] `notificationService fetchUnreadCount calls correct endpoint`
- [ ] `notificationService archiveAll sends PATCH request`
- [ ] `useNotificationPolling polls every 30 seconds`
- [ ] `useNotificationPolling stops when disabled`
- [ ] `NotificationsContext deduplicates local and backend notifications`
- [ ] `NotificationsContext merges and sorts by timestamp desc`
- [ ] `NotificationsPanel renders backend notifications with eventName`
- [ ] `NotificationsPanel calls markAllRead on open`
- [ ] `NotificationsPanel shows fallback when eventName is null`
- [ ] `NotificationsPanel clearAll calls archiveAll on backend`
- [ ] `NotificationsPanel archived notifications do not reappear after polling`
- [ ] `NotificationsContext restores state on archiveAll failure (optimistic rollback)`

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CRITERIO-NTF-1.1 a NTF-5.5
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar que todas las reglas de negocio (RN-NTF-01 a RN-NTF-11) están cubiertas
- [ ] Test E2E: pago fallido → notificación aparece en panel tras polling
- [ ] Test E2E: reserva expirada por backend → notificación visible al recargar
- [ ] Test E2E: marcar como leídas → badge a 0 → persiste tras recarga
- [ ] Test E2E: limpiar todo → notificaciones no reaparecen tras polling/recarga
- [ ] Test E2E: nueva notificación visible después de archivar las anteriores
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
