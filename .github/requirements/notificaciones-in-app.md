# Requerimiento: Notificaciones In-App en Tiempo Real

## Contexto del feature

Actualmente el sistema genera notificaciones persistentes en `ms-notifications` (PostgreSQL) cuando ocurre un pago fallido (`PAYMENT_FAILED`) o una reserva expirada (`RESERVATION_EXPIRED`), pero estas **nunca llegan al usuario**. El frontend maneja notificaciones 100% locales (`NotificationsContext`) que se pierden al recargar la página y no reflejan los eventos reales del backend.

El componente `NotificationsPanel` ya existe en el `NavBar` (ícono de campana con badge de no leídas, dropdown animado con Framer Motion) pero solo muestra notificaciones efímeras del estado local de React.

### Problema identificado

```
ms-ticketing  ──RabbitMQ──►  ms-notifications (DB)  ──✖──►  Frontend (local state)
                                                        ↑
                                            Sin conexión entre
                                         backend y frontend
```

- **Pago rechazado**: `ms-ticketing` publica `TicketPaymentFailedEvent` → `ms-notifications` persiste `Notification(PAYMENT_FAILED)` → el frontend genera una notificación local independiente que no consulta el backend.
- **Reserva expirada**: `ExpirationService` en `ms-ticketing` publica `TicketExpiredEvent` cada 60s → `ms-notifications` persiste `Notification(RESERVATION_EXPIRED)` → el frontend solo notifica si el timer local llega a 0, pero si el usuario recarga la página o la expiración ocurre por backend, **no se entera**.

### Solución propuesta

Conectar el frontend con `ms-notifications` mediante **polling periódico** al endpoint `GET /api/v1/notifications/buyer/{buyerId}`, exponiendo la ruta a través del `api-gateway`. La UI existente (`NotificationsPanel`) debe mostrar tanto notificaciones locales como las obtenidas del backend, unificadas en una sola lista.

**Capas afectadas:** `api-gateway`, `ms-notifications`, `frontend/`
**Depende de:** HU-05 (ms-ticketing — pago simulado), HU-06 (ms-ticketing — expiración), HU-07 (ms-notifications — consumo de eventos RabbitMQ)
**Stack Backend:** Java 17+ · Spring Boot 3.x · PostgreSQL · RabbitMQ
**Stack Frontend:** React · TypeScript · Axios · CSS Modules · Framer Motion
**Diseño de referencia:** Teatro Noir — panel de notificaciones con dropdown animado desde ícono de campana en NavBar

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

## Historias de Usuario

### HU-NTF-01: Exposición de ruta de notificaciones en API Gateway — SP: 2

Como **Frontend**
Quiero que el API Gateway enrute las peticiones `/api/v1/notifications/**` hacia `ms-notifications`
Para poder consultar las notificaciones persistentes del backend desde el navegador

**Microservicio:** `api-gateway`
**Prioridad:** Alta (bloqueante para las demás historias)
**Justificación SP:** Configuración de ruta y propagación de headers (`X-User-Id`). Sin lógica de negocio compleja pero requiere validar CORS y conectividad con el servicio.

#### Criterios de Aceptación

**CA-01. Ruta de notificaciones accesible desde el gateway**
```gherkin
Escenario: Proxy de peticiones de notificaciones
  Dado que el API Gateway está en ejecución
  Y ms-notifications está disponible en el puerto configurado
  Cuando el frontend envía GET /api/v1/notifications/buyer/{buyerId}
  Entonces el gateway redirige la petición a ms-notifications
  Y la respuesta del microservicio se retorna al cliente con status 200
```

**CA-02. Propagación del header X-User-Id**
```gherkin
Escenario: Header de usuario propagado al microservicio
  Dado que el frontend envía una petición con header X-User-Id
  Cuando el API Gateway redirige la petición a ms-notifications
  Entonces el header X-User-Id está presente en la petición recibida por ms-notifications
```

#### Subtasks

**DEV**
- [ ] Agregar ruta `/api/v1/notifications/**` en la configuración de rutas del API Gateway apuntando a `ms-notifications`
- [ ] Verificar propagación de headers `X-User-Id` y `Content-Type`
- [ ] Validar CORS para el origen del frontend

**QA**
- [ ] Verificar que `GET /api/v1/notifications/buyer/{buyerId}` responde 200 a través del gateway
- [ ] Verificar que el header `X-User-Id` llega correctamente a ms-notifications
- [ ] Verificar que una ruta inexistente devuelve 404

---

### HU-NTF-02: Endpoint de marcar notificaciones como leídas — SP: 3

Como **Comprador**
Quiero que al abrir el panel de notificaciones las notificaciones se marquen como leídas en el servidor
Para que el contador de no leídas sea consistente entre sesiones y dispositivos

**Microservicio:** `ms-notifications`
**Prioridad:** Alta
**Justificación SP:** Requiere nuevo campo `read` en la entidad `Notification`, migración de esquema, nuevo endpoint PATCH, lógica de servicio y pruebas. Impacto moderado en el modelo existente.

#### Criterios de Aceptación

**CA-01. Campo read persistido en la notificación**
```gherkin
Escenario: Notificación creada con estado no leída
  Dado que ms-notifications recibe un evento de RabbitMQ (pago fallido o reserva expirada)
  Cuando crea la notificación en la base de datos
  Entonces el campo "read" tiene valor false por defecto
```

**CA-02. Endpoint para marcar notificaciones como leídas**
```gherkin
Escenario: Marcar todas las notificaciones de un comprador como leídas
  Dado que el comprador tiene 3 notificaciones con read = false
  Cuando el frontend envía PATCH /api/v1/notifications/buyer/{buyerId}/read-all
  Entonces todas las notificaciones del comprador se actualizan a read = true
  Y la respuesta tiene status 200 con el conteo de notificaciones actualizadas
```

**CA-03. Endpoint de conteo de no leídas**
```gherkin
Escenario: Obtener cantidad de notificaciones no leídas
  Dado que el comprador tiene 5 notificaciones, 3 con read = false
  Cuando el frontend envía GET /api/v1/notifications/buyer/{buyerId}/unread-count
  Entonces la respuesta contiene { "unreadCount": 3 }
```

#### Subtasks

**DEV**
- [ ] Agregar campo `read` (boolean, default false) a la entidad `Notification`
- [ ] Crear migración/actualización del esquema PostgreSQL
- [ ] Implementar `PATCH /api/v1/notifications/buyer/{buyerId}/read-all` en `NotificationController`
- [ ] Implementar `GET /api/v1/notifications/buyer/{buyerId}/unread-count` en `NotificationController`
- [ ] Actualizar `NotificationService` con métodos `markAllReadByBuyerId()` y `countUnreadByBuyerId()`
- [ ] Actualizar `NotificationRepository` con queries necesarias

**QA**
- [ ] Verificar que nuevas notificaciones se crean con `read = false`
- [ ] Verificar que PATCH `/read-all` actualiza solo las notificaciones del buyerId dado
- [ ] Verificar que GET `/unread-count` retorna el conteo correcto
- [ ] Verificar idempotencia: llamar PATCH `/read-all` dos veces no genera error

---

### HU-NTF-03: Servicio frontend para consultar notificaciones del backend — SP: 3

Como **Frontend**
Quiero un servicio que consulte periódicamente las notificaciones del comprador desde `ms-notifications`
Para mantener la lista de notificaciones sincronizada con el servidor sin requerir WebSocket

**Capa:** `frontend/src/services/` y `frontend/src/hooks/`
**Prioridad:** Alta
**Justificación SP:** Nuevo servicio Axios, hook de polling con `useEffect` + `setInterval`, mapeo de tipos backend→frontend, manejo de errores y limpieza de intervalos. Complejidad media.

#### Criterios de Aceptación

**CA-01. Servicio de notificaciones con Axios**
```gherkin
Escenario: Consulta de notificaciones del comprador
  Dado que el servicio de notificaciones está configurado
  Cuando se invoca fetchNotifications(buyerId)
  Entonces se envía GET /api/v1/notifications/buyer/{buyerId}?page=0&size=20 con header X-User-Id
  Y se retorna la lista de notificaciones mapeadas al tipo AppNotification del frontend
```

**CA-02. Polling periódico cada 30 segundos**
```gherkin
Escenario: Polling automático de notificaciones
  Dado que el comprador está en cualquier pantalla de la aplicación
  Cuando han transcurrido 30 segundos desde la última consulta
  Entonces el frontend consulta automáticamente las notificaciones del backend
  Y actualiza la lista sin duplicar notificaciones ya existentes
```

**CA-03. Detención del polling en pantallas transaccionales**
```gherkin
Escenario: Polling pausado durante checkout/pago
  Dado que el comprador está en la pantalla de checkout, pago o fallo
  Cuando el timer transaccional está activo
  Entonces el polling de notificaciones se pausa
  Y se reanuda al salir del flujo transaccional
```

**CA-04. Sincronización del conteo de no leídas**
```gherkin
Escenario: Badge del ícono de campana refleja el backend
  Dado que el comprador tiene 2 notificaciones no leídas en el servidor
  Cuando el frontend realiza el polling
  Entonces el badge rojo del ícono de campana muestra "2"
```

#### Subtasks

**DEV**
- [ ] Crear `frontend/src/services/notificationService.ts` con funciones: `fetchNotifications(buyerId)`, `markAllRead(buyerId)`, `fetchUnreadCount(buyerId)`
- [ ] Crear tipo de respuesta del backend en `frontend/src/types/notification.ts`
- [ ] Crear hook `useNotificationPolling(buyerId, enabled)` con intervalo de 30s
- [ ] Mapear tipos del backend (`PAYMENT_FAILED`, `RESERVATION_EXPIRED`) a tipos del frontend (`payment_rejected`, `timer_expired`)
- [ ] Integrar con `NotificationsContext` para unificar notificaciones locales y del backend
- [ ] Agregar deduplicación por `reservationId + type` para evitar duplicados entre local y backend

**QA**
- [ ] Verificar que el servicio consulta el endpoint correcto con los headers adecuados
- [ ] Verificar que el polling se ejecuta cada 30 segundos
- [ ] Verificar que no hay notificaciones duplicadas entre locales y backend
- [ ] Verificar que el polling se pausa durante el flujo transaccional
- [ ] Verificar que el badge se actualiza correctamente con el conteo del backend

---

### HU-NTF-04: Visualización unificada de notificaciones en el panel — SP: 5

Como **Comprador**
Quiero ver en el panel de notificaciones del NavBar tanto las notificaciones locales (generadas durante mi sesión) como las persistentes del backend (pago fallido, reserva expirada)
Para tener una vista completa de todos los eventos relevantes de mis compras sin importar si recargué la página

**Capa:** `frontend/src/components/NavBar/NotificationsPanel.tsx`, `frontend/src/contexts/NotificationsContext.tsx`
**Prioridad:** Alta
**Justificación SP:** Requiere refactorizar el `NotificationsContext` para soportar dos fuentes de datos (local + backend), lógica de deduplicación, merge ordenado por timestamp, actualización del estado `read` con el servidor, y adaptar el `NotificationsPanel` para mostrar información adicional (nombre del evento desde el backend). Complejidad alta.

#### Criterios de Aceptación

**CA-01. Notificaciones del backend visibles al abrir el panel**
```gherkin
Escenario: Panel muestra notificaciones del servidor
  Dado que el comprador tiene 2 notificaciones de pago fallido en el backend
  Y no tiene notificaciones locales
  Cuando abre el panel de notificaciones (clic en ícono campana)
  Entonces el panel muestra las 2 notificaciones con ícono XCircle y fondo rojo
  Y cada notificación muestra el título, mensaje y tiempo relativo
```

**CA-02. Notificaciones locales y del backend unificadas sin duplicados**
```gherkin
Escenario: Merge de notificaciones sin duplicados
  Dado que el comprador tiene 1 notificación local de tipo "payment_rejected" para la reserva "R-001"
  Y el backend tiene 1 notificación de tipo "PAYMENT_FAILED" para la misma reserva "R-001"
  Cuando el frontend realiza el polling y renderiza el panel
  Entonces se muestra solo 1 notificación (sin duplicados)
  Y la lista está ordenada por timestamp descendente (más reciente primero)
```

**CA-03. Persistencia de notificaciones entre recargas de página**
```gherkin
Escenario: Notificaciones sobreviven al refrescar la página
  Dado que el comprador recibió una notificación de reserva expirada
  Cuando recarga la página (F5)
  Y el polling se ejecuta por primera vez
  Entonces la notificación de reserva expirada aparece en el panel
  Y el badge reflejael conteo de no leídas
```

**CA-04. Notificación de expiración por backend (sin timer local)**
```gherkin
Escenario: Expiración detectada por el backend mientras el usuario no estaba en la app
  Dado que el comprador creó una reserva y cerró el navegador
  Y el backend expiró la reserva automáticamente (ExpirationService cada 60s)
  Cuando el comprador vuelve a abrir la aplicación
  Y el polling obtiene las notificaciones
  Entonces el panel muestra "Tiempo agotado" con el nombre del evento
  Y el badge indica 1 notificación no leída
```

**CA-05. Marcar como leídas al abrir el panel sincroniza con el backend**
```gherkin
Escenario: Apertura del panel marca como leídas en el servidor
  Dado que el comprador tiene 3 notificaciones no leídas
  Cuando abre el panel de notificaciones
  Entonces el frontend llama a PATCH /api/v1/notifications/buyer/{buyerId}/read-all
  Y el badge se actualiza a 0
  Y al cerrar y reabrir el panel las notificaciones siguen marcadas como leídas
```

**CA-06. Estilos diferenciados por tipo de notificación**
```gherkin
Escenario: Diferenciación visual por tipo
  Dado que el panel contiene notificaciones de tipos diferentes
  Cuando el comprador visualiza el listado
  Entonces las notificaciones de pago rechazado muestran ícono XCircle con acento rojo
  Y las notificaciones de reserva expirada muestran ícono Timer con acento verde/ámbar
  Y cada notificación muestra el nombre del evento asociado
```

#### Subtasks

**DEV**
- [ ] Refactorizar `NotificationsContext` para mantener dos arreglos internos: `localNotifications` y `backendNotifications`
- [ ] Implementar función de merge + deduplicación por `reservationId + type`
- [ ] Exponer lista unificada y ordenada por timestamp en el contexto
- [ ] Actualizar `NotificationsPanel` para mostrar el nombre del evento (campo `eventTitle` del backend)
- [ ] Integrar llamada a `markAllRead()` al abrir el panel
- [ ] Integrar hook `useNotificationPolling` en el provider de notificaciones
- [ ] Mapeo de tipos backend a frontend: `PAYMENT_FAILED` → `payment_rejected`, `RESERVATION_EXPIRED` → `timer_expired`

**QA**
- [ ] Verificar que el panel muestra notificaciones del backend correctamente
- [ ] Verificar que no hay duplicados cuando existe la misma notificación local y en backend
- [ ] Verificar que las notificaciones persisten tras recargar la página
- [ ] Verificar que abrir el panel sincroniza el estado leído con el servidor
- [ ] Verificar orden descendente por timestamp
- [ ] Verificar que los estilos de cada tipo de notificación son correctos

---

### HU-NTF-05: Enriquecimiento del evento de notificación con nombre del evento — SP: 3

Como **Comprador**
Quiero que las notificaciones de pago fallido y reserva expirada incluyan el nombre del evento (obra de teatro)
Para entender de inmediato a qué compra se refiere la notificación

**Microservicio:** `ms-notifications` y/o `ms-ticketing`
**Prioridad:** Media
**Justificación SP:** Requiere agregar `eventName` al payload de los eventos RabbitMQ (`TicketPaymentFailedEvent`, `TicketExpiredEvent`), actualizar los publishers en `ms-ticketing`, actualizar los consumers en `ms-notifications`, y persistir el campo en la entidad `Notification`. Impacto transversal en dos microservicios.

#### Criterios de Aceptación

**CA-01. Evento RabbitMQ incluye nombre del evento**
```gherkin
Escenario: TicketPaymentFailedEvent contiene eventName
  Dado que un pago es rechazado para una reserva del evento "Hamlet en el Noir"
  Cuando ms-ticketing publica el TicketPaymentFailedEvent
  Entonces el payload incluye el campo eventName con valor "Hamlet en el Noir"
```

**CA-02. TicketExpiredEvent incluye nombre del evento**
```gherkin
Escenario: TicketExpiredEvent contiene eventName
  Dado que una reserva del evento "Romeo y Julieta" expira
  Cuando ms-ticketing publica el TicketExpiredEvent
  Entonces el payload incluye el campo eventName con valor "Romeo y Julieta"
```

**CA-03. Notificación persistida con nombre del evento**
```gherkin
Escenario: Notificación almacenada con eventName
  Dado que ms-notifications consume un evento con eventName = "Hamlet en el Noir"
  Cuando crea la notificación en la base de datos
  Entonces la notificación tiene el campo eventName = "Hamlet en el Noir"
```

**CA-04. Endpoint retorna eventName en la respuesta**
```gherkin
Escenario: API de notificaciones incluye eventName
  Dado que el comprador consulta sus notificaciones
  Cuando el frontend llama a GET /api/v1/notifications/buyer/{buyerId}
  Entonces cada notificación en la respuesta incluye el campo eventName
```

#### Subtasks

**DEV**
- [ ] Agregar campo `eventName` a `TicketPaymentFailedEvent` y `TicketExpiredEvent` en `ms-ticketing`
- [ ] Actualizar `TicketPaidEvent` para incluir `eventName` (consistencia)
- [ ] Actualizar publishers en `RabbitMQPublisherService` de `ms-ticketing` para incluir el nombre del evento (obtener de la reserva o del servicio de eventos)
- [ ] Agregar campo `eventName` a la entidad `Notification` en `ms-notifications`
- [ ] Actualizar consumers en `ms-notifications` para persistir `eventName`
- [ ] Actualizar DTOs de respuesta para incluir `eventName`

**QA**
- [ ] Verificar que los eventos RabbitMQ contienen el campo `eventName`
- [ ] Verificar que la notificación se persiste con `eventName` correctamente
- [ ] Verificar que el endpoint `GET /buyer/{buyerId}` retorna `eventName`
- [ ] Verificar compatibilidad con eventos existentes que no tengan `eventName` (graceful handling)

---

## Resumen de Historias

| ID | Título | SP | Capa | Prioridad |
|----|--------|----|------|-----------|
| HU-NTF-01 | Exposición de ruta de notificaciones en API Gateway | 2 | `api-gateway` | Alta |
| HU-NTF-02 | Endpoint de marcar notificaciones como leídas | 3 | `ms-notifications` | Alta |
| HU-NTF-03 | Servicio frontend para consultar notificaciones del backend | 3 | `frontend` | Alta |
| HU-NTF-04 | Visualización unificada de notificaciones en el panel | 5 | `frontend` | Alta |
| HU-NTF-05 | Enriquecimiento del evento de notificación con nombre del evento | 3 | `ms-ticketing` + `ms-notifications` | Media |
| **Total** | | **16 SP** | | |

## Orden de implementación sugerido

```
HU-NTF-01 (Gateway)  ──►  HU-NTF-02 (Backend read/unread)  ──►  HU-NTF-05 (Enrich events)
                                      │
                                      ▼
                           HU-NTF-03 (Frontend service + polling)  ──►  HU-NTF-04 (UI unificada)
```

> **HU-NTF-01** es bloqueante: sin ruta en el gateway, el frontend no puede llegar a `ms-notifications`.
> **HU-NTF-05** puede ejecutarse en paralelo con HU-NTF-03 si hay dos desarrolladores disponibles.
