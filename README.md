<div align="center">

# 🎭 TICKETING_SEM7

### Taller Semana 7 — Sistema de Venta de Entradas para Artes Escénicas

**Equipo del Proyecto:**  
Christopher Ismael Pallo Arias — **QA**  
Luis Alfredo Pinzón Quintero — **DEV**

**Proyecto:** Ticketing MVP — Microservicios Java + React SPA + API Gateway + Mensajería Asíncrona  
**Objetivo:** Construir e integrar las piezas críticas de un sistema de venta de entradas funcional: reservas temporizadas de 10 minutos, pago simulado con liberación asíncrona de entradas no pagadas, notificaciones en tiempo real y panel de administración completo sobre una arquitectura de microservicios distribuida y containerizada.

<br />

### 🛠️ Stack Tecnológico

**Microservicios · API Gateway · SPA React · Mensajería Asíncrona · Containerización**
<br />
<img src="https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17" />
<img src="https://img.shields.io/badge/Spring_Boot_3.3-F2F4F9?style=for-the-badge&logo=spring-boot" alt="Spring Boot" />
<img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript_5.9-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/PostgreSQL_15-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/RabbitMQ_3.13-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" alt="RabbitMQ" />
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
<img src="https://img.shields.io/badge/Flyway-CC0200?style=for-the-badge&logo=flyway&logoColor=white" alt="Flyway" />

</div>

---

## 🎭 Sobre el Producto (Contexto de Negocio)

**Sistema de Venta de Entradas para Obras de Teatro**  
El sistema resuelve el problema histórico del inventario bloqueado: cuando un comprador intenta adquirir una entrada pero no completa el pago, el sistema tradicional congela la venta indefinidamente, privando a otros compradores de ese cupo.

Nuestro MVP orquesta un **temporizador ágil de 10 minutos** respaldado por jobs `@Scheduled`, validaciones optimistas de inventario (`@Version` en `Reservation`) y liberación asíncrona vía **RabbitMQ con Outbox Pattern**. Si el pago falla o el tiempo expira, las entradas se liberan automáticamente garantizando **cero sobreventas**.

Para el espectador significa transparencia y disponibilidad real de entradas. Para el organizador, maximización de ingresos y control total del aforo por sala.

**Funcionalidades construidas en este MVP:**
- Configuración de aforos estrictos por sala y validación de topes de capacidad.
- Estructuración dinámica de categorías (**Tiers**): *General, VIP y Early Bird* (temporal, con fecha de vencimiento).
- Reserva con cuenta regresiva de 10 minutos y máximo 3 intentos de pago.
- Simulador de transacciones: `APPROVED` o `DECLINED`.
- Liberación asíncrona de entradas abandonadas vía scheduler + RabbitMQ.
- Notificaciones in-app: pago exitoso, pago fallido, entrada expirada, evento cancelado.
- Mapa de asientos visual por tier (`SeatMap`).
- Panel de Administración con estadísticas consolidadas en tiempo real.
- Autenticación JWT para dos roles: `ADMIN` y `BUYER` (incluyendo checkout como guest).

---

## 📚 Glosario Transversal

| Término | Definición |
|---------|-----------|
| **Evento** (`event`) | Obra de teatro publicada para venta de entradas |
| **Aforo** (`capacity`) | Cantidad total de entradas disponibles por Evento |
| **Tier** (`tier`) | Nivel de precio: `GENERAL`, `VIP`, `EARLY_BIRD` |
| **Reserva** (`reservation`) | Bloqueo temporal de una entrada (TTL 10 min) mientras el comprador completa el pago |
| **Ticket** (`ticket`) | Comprobante confirmado tras pago exitoso. Descargable en PDF |
| **Timeout** | Vencimiento automático de la reserva cuando el comprador no paga a tiempo |
| **Scheduler** | Proceso `@Scheduled` que corre en segundo plano revisando y expirando reservas vencidas |
| **Outbox Pattern** | Patrón de consistencia: se escribe en tabla `outbox_event` dentro de la misma transacción DB; un job lo publica asincrónamente a RabbitMQ |
| **Bloqueo Optimista** | Campo `@Version` en `Reservation` que evita race conditions: solo un comprador puede reservar la misma entrada simultáneamente |
| **Pago Simulado** (`mock payment`) | Resultado de autorización controlado: `APPROVED` o `DECLINED` |
| **X-Role / X-User-Id** | Headers inyectados por el API Gateway tras validar el JWT. Los microservicios confían en ellos; los clientes no pueden falsificarlos |
| **X-Service-Auth** | Header secreto para autenticación inter-microservicio (ms-ticketing → ms-events) |

---

## 🔀 Flujo Operativo del MVP

```mermaid
flowchart TD
    A[Acceso al sistema] --> B{Rol del usuario}

    B -->|Administrador| C[Crear sala con capacidad máxima]
    C --> D[Crear evento en estado DRAFT]
    D --> E[Configurar Tiers: General / VIP / Early Bird]
    E --> F[Publicar evento → estado PUBLISHED]
    F --> G[Evento visible en cartelera pública]

    B -->|Comprador| H[Consultar cartelera y disponibilidad por Tier]
    H --> I[Seleccionar Tier y asientos]
    I --> J[Crear Reserva → TTL 10 minutos]
    J --> K{Pago dentro del plazo}

    K -->|APPROVED| L[Confirmar Ticket]
    L --> M[Notificación PAYMENT_SUCCESS]
    M --> N[Descargar PDF del Ticket]

    K -->|DECLINED hasta 3 intentos| O[Notificación PAYMENT_FAILED]
    O --> K

    K -->|Tiempo expirado| P[Scheduler libera entrada asíncronamente]
    P --> Q[Notificación TICKET_EXPIRED vía RabbitMQ]
    Q --> G
```

---

## 🚀 Arquitectura Real Construida

```mermaid
flowchart TD
    Z[Cliente Web / Frontend React :5173] -->|HTTP REST + JWT Bearer| A[API Gateway :8080]

    A -->|Autenticación| B{AuthController + JwtAuthenticationFilter}
    B -->|POST /register/buyer| C[(postgres-gateway: users)]
    B -->|POST /login| D[JWT firmado HMAC-SHA256]
    B -->|user.registered event| R[(RabbitMQ: auth.exchange)]

    A -->|/api/v1/events y /rooms| F[ms-events :8081]
    A -->|/api/v1/reservations y /tickets| G[ms-ticketing :8082]
    A -->|/api/v1/notifications| H[ms-notifications :8083]

    F -->|JDBC| I[(events_db: event, room, tier, seat, outbox)]
    F -->|event.cancelled Outbox| R
    F -->|HTTP GET stats| G

    G -->|JDBC| J[(ticket_db: reservation, ticket, fraud_log, outbox)]
    G -->|ticket.paid/failed/expired Outbox| R
    G -->|consume event.cancelled + user.registered| R
    G -->|HTTP WebClient + X-Service-Auth| F

    H -->|JDBC| K[(notif_db: notification)]
    H -->|consume ticket.* + event.cancelled| R

    R -->|DLQ habilitadas| L{tickets.dlq.exchange}
```

---

## 🌌 Diagramas C4 — Arquitectura de Software

> Modelo C4 (Simon Brown): **Contexto → Contenedores → Componentes → Código**.  
> Generados a partir de la [auditoría de arquitectura completa](./docs/c4-audit-matrix.md).

---

### 📍 Nivel 1 — Contexto del Sistema

```mermaid
C4Context
    title Diagrama C4 · L1: Contexto del Sistema

    Person(buyer, "Comprador (BUYER)", "Adquiere entradas para eventos de artes escénicas. Reserva, paga y descarga su ticket. Recibe notificaciones in-app.")
    Person(admin, "Administrador (ADMIN)", "Gestiona el catálogo: crea salas, configura eventos y tiers, publica o cancela funciones. Consulta estadísticas de ventas y reservas.")

    System(ticketingSystem, "Ticketing System", "Plataforma de venta de entradas para teatro. Gestiona aforos, reservas temporizadas de 10 min, pagos simulados, notificaciones asíncronas y panel de administración.")

    System_Ext(picsumCDN, "Picsum Photos CDN", "Proveedor externo de imágenes de portada para eventos en entorno de desarrollo.")

    Rel(buyer, ticketingSystem, "Navega cartelera, reserva y paga entradas, descarga PDF, recibe notificaciones", "HTTPS · React SPA")
    Rel(admin, ticketingSystem, "Crea salas y eventos, configura tiers, publica/cancela, consulta estadísticas", "HTTPS · React SPA")
    Rel(ticketingSystem, picsumCDN, "Referencia imágenes de portada de eventos", "HTTPS")
```

---

### 📍 Nivel 2 — Contenedores

```mermaid
C4Container
    title Diagrama C4 · L2: Contenedores

    Person(buyer, "Comprador", "")
    Person(admin, "Administrador", "")

    System_Boundary(sys, "Ticketing System") {
        Container(frontend, "Frontend SPA", "React 19 · TypeScript · Vite · Nginx", "Interfaz para compradores y admins. Rutas públicas y protegidas. Polling de notificaciones, mapa de asientos y carrito con TTL.")
        Container(gateway, "API Gateway", "Spring Boot 3.3 · Spring Cloud Gateway · Spring Security · Bucket4j · JWT", "Punto de entrada único. Autentica, aplica rate limiting 5 req/15 min por IP, enruta e inyecta X-Role y X-User-Id a los microservicios.")
        Container(msEvents, "ms-events", "Spring Boot 3.3 · JPA · Flyway · RabbitMQ", "Catálogo de eventos, salas, tiers y mapa de asientos. Ciclo de vida DRAFT → PUBLISHED → CANCELLED. Publica event.cancelled via Outbox.")
        Container(msTicketing, "ms-ticketing", "Spring Boot 3.3 · JPA · WebClient · Flyway · RabbitMQ", "Reservas con TTL 10 min, pago MOCK, tickets PDF y expiración automática via Scheduler. Publica ticket.paid/failed/expired via Outbox.")
        Container(msNotifications, "ms-notifications", "Spring Boot 3.3 · JPA · Flyway · RabbitMQ", "Consume eventos de RabbitMQ y persiste notificaciones in-app por comprador.")
        ContainerDb(dbGateway, "postgres-gateway", "PostgreSQL 16 · :5436", "Usuarios del sistema: email, password_hash BCrypt, role ADMIN o BUYER. (gateway_db)")
        ContainerDb(dbEvents, "db-events", "PostgreSQL 15 · :5432", "Catálogo: event, room, tier, seat, outbox_event, idempotency_key. (events_db)")
        ContainerDb(dbTicketing, "db-ticketing", "PostgreSQL 15 · :5433", "Transacciones: reservation, ticket, seat_reservation, fraud_log, outbox_event. (ticket_db)")
        ContainerDb(dbNotifications, "db-notifications", "PostgreSQL 15 · :5435", "Notificaciones in-app: notification. (notif_db)")
        ContainerQueue(rabbitmq, "RabbitMQ", "RabbitMQ 3.13 · :5672", "Broker de mensajería asíncrona. Exchanges: auth.exchange, events.exchange, tickets.exchange. DLQ habilitadas para ticket.*")
    }

    System_Ext(picsum, "Picsum Photos CDN", "")

    Rel(buyer, frontend, "Navega y compra entradas", "HTTPS :5173")
    Rel(admin, frontend, "Gestiona catálogo de eventos", "HTTPS :5173")
    Rel(frontend, gateway, "Todas las llamadas REST con Axios y JWT Bearer", "HTTP :8080")
    Rel(gateway, msEvents, "Rutea /api/v1/events y /api/v1/rooms", "HTTP :8081")
    Rel(gateway, msTicketing, "Rutea /api/v1/reservations y /api/v1/tickets", "HTTP :8082")
    Rel(gateway, msNotifications, "Rutea /api/v1/notifications", "HTTP :8083")
    Rel(gateway, dbGateway, "Lee/escribe entidades User", "JDBC")
    Rel(gateway, rabbitmq, "Publica user.registered a auth.exchange", "AMQP")
    Rel(msEvents, dbEvents, "Lee/escribe catálogo completo", "JDBC")
    Rel(msEvents, rabbitmq, "Publica event.cancelled via Outbox", "AMQP")
    Rel(msEvents, msTicketing, "HTTP GET /api/v1/tickets/admin/stats", "HTTP RestTemplate")
    Rel(msTicketing, dbTicketing, "Lee/escribe reservas y tickets", "JDBC")
    Rel(msTicketing, rabbitmq, "Publica ticket.paid/failed/expired via Outbox", "AMQP")
    Rel(msTicketing, rabbitmq, "Consume event.cancelled y user.registered", "AMQP")
    Rel(msTicketing, msEvents, "GET evento + PATCH quota de tier con X-Service-Auth", "HTTP WebClient")
    Rel(msNotifications, dbNotifications, "Persiste notificaciones in-app", "JDBC")
    Rel(msNotifications, rabbitmq, "Consume ticket.paid, ticket.failed, ticket.expired, event.cancelled", "AMQP")
    Rel(frontend, picsum, "Carga imágenes de portada de eventos", "HTTPS")
```

---

### 📍 Nivel 3 — Componentes: API Gateway

```mermaid
C4Component
    title Diagrama C4 · L3: Componentes de API Gateway

    Container_Boundary(gw, "API Gateway — :8080") {
        Component(jwtFilter, "JwtAuthenticationFilter", "Spring WebFilter · @Order(HIGHEST)", "Valida JWT Bearer en cada request. Elimina X-Role/X-User-Id del cliente e inyecta los del token. Deja pasar OPTIONS para CORS.")
        Component(jwtService, "JwtService", "Spring Service · jjwt 0.12", "Genera y valida tokens JWT firmados HMAC-SHA256. Clave mínima de 32 chars. Expiración de 8 h configurable.")
        Component(rateLimitService, "RateLimitService", "Spring Service · Bucket4j 8.10", "Rate limiting por IP: 5 req / 15 min en POST /auth/login. LRU cache para hasta 10 000 IPs simultáneas.")
        Component(authService, "AuthService", "Spring Service · BCryptPasswordEncoder strength=10", "login, registerAdmin, registerBuyer, changePassword. Valida patrón de contraseña: mayúscula + número, mínimo 8 chars.")
        Component(authEventPub, "AuthEventPublisher", "Spring Service · RabbitTemplate", "Publica UserRegisteredEvent a auth.exchange con routing key user.registered tras registro exitoso de BUYER.")
        Component(userRepo, "UserRepository", "Spring Data JPA", "CRUD de entidad User en gateway_db: id UUID, email único, password_hash, role ADMIN o BUYER, timestamps.")
        Component(secHeaders, "SecurityHeadersFilter", "Spring WebFilter", "Añade en cada respuesta: HSTS, CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy.")
        Component(exceptionHandler, "GlobalExceptionHandler", "@RestControllerAdvice", "Errores estructurados sin stacktraces para 400, 401, 403, 404, 409, 429.")
    }

    ContainerDb(dbGateway, "postgres-gateway", "PostgreSQL 16", "")
    ContainerQueue(rabbitmq, "RabbitMQ", "auth.exchange", "")
    Container(msEvents, "ms-events", ":8081", "")
    Container(msTicketing, "ms-ticketing", ":8082", "")
    Container(msNotif, "ms-notifications", ":8083", "")

    Rel(jwtFilter, jwtService, "isTokenValid + validateAndExtractClaims")
    Rel(authService, jwtService, "generateToken(userId, email, role)")
    Rel(authService, userRepo, "findByEmail, save, existsByEmail")
    Rel(authService, rateLimitService, "tryConsume(clientIp)")
    Rel(authService, authEventPub, "publishUserRegistered(event)")
    Rel(authEventPub, rabbitmq, "convertAndSend user.registered", "AMQP")
    Rel(userRepo, dbGateway, "SQL queries", "JDBC")
    Rel(jwtFilter, msEvents, "Forward con X-Role y X-User-Id inyectados", "HTTP")
    Rel(jwtFilter, msTicketing, "Forward con X-Role y X-User-Id inyectados", "HTTP")
    Rel(jwtFilter, msNotif, "Forward con X-Role y X-User-Id inyectados", "HTTP")
```

---

### 📍 Nivel 3 — Componentes: ms-events

```mermaid
C4Component
    title Diagrama C4 · L3: Componentes de ms-events

    Container_Boundary(ev, "ms-events — :8081") {
        Component(eventCtrl, "EventController", "REST Controller · /api/v1/events/**", "CRUD de eventos. Crear en DRAFT, listar PUBLISHED, detalle, admin views, publicar y cancelar. X-Role ADMIN para escritura.")
        Component(roomCtrl, "RoomController", "REST Controller · /api/v1/rooms/**", "CRUD de salas. GET público. POST y PUT protegidos por X-Role ADMIN.")
        Component(tierCtrl, "TierController", "REST Controller · /api/v1/events/{id}/tiers/**", "Configurar, listar, añadir y eliminar tiers. PATCH quota protegido por X-Service-Auth para llamadas internas de ms-ticketing.")
        Component(seatCtrl, "SeatController", "REST Controller · /api/v1/events/{id}/seats/**", "Mapa de asientos por tier y estado. Verificación de disponibilidad de seats antes de confirmar reserva.")
        Component(eventSvc, "EventService", "Spring Service", "Ciclo de vida DRAFT → PUBLISHED → CANCELLED. Valida capacity, fechas futuras y unicidad de título más fecha.")
        Component(tierSvc, "TierService", "Spring Service", "Configura tiers, valida que quota total sea menor o igual a capacity. Decremento e incremento de quota idempotente por X-Idempotency-Key.")
        Component(seatSvc, "SeatService", "Spring Service", "Auto-genera mapa de asientos al publicar evento. Consulta disponibilidad por tier y estado de seat.")
        Component(eventStatsSvc, "EventStatsService", "Spring Service", "Consolida estadísticas de eventos locales más tickets vendidos de ms-ticketing via TicketingClient para el panel admin.")
        Component(outboxScheduler, "OutboxPublisherScheduler", "@Scheduled · Outbox Pattern", "Publica mensajes PENDING de outbox_event a events.exchange. Garantiza at-least-once delivery hacia RabbitMQ.")
        Component(ticketingClient, "TicketingClient", "HTTP Client · RestTemplate", "Llama GET /api/v1/tickets/admin/stats en ms-ticketing para cifras consolidadas de ventas.")
    }

    ContainerDb(dbEvents, "db-events", "events_db", "")
    ContainerQueue(rabbitmq, "RabbitMQ", "events.exchange", "")
    Container(msTicketing, "ms-ticketing", ":8082", "")

    Rel(eventCtrl, eventSvc, "createEvent, publishEvent, cancelEvent")
    Rel(eventCtrl, eventStatsSvc, "getAdminStats")
    Rel(tierCtrl, tierSvc, "configureEventTiers, decrementQuota, incrementQuota")
    Rel(seatCtrl, seatSvc, "getSeats, checkAvailability")
    Rel(eventStatsSvc, ticketingClient, "getAdminSummary()")
    Rel(outboxScheduler, rabbitmq, "convertAndSend event.cancelled", "AMQP")
    Rel(ticketingClient, msTicketing, "GET /api/v1/tickets/admin/stats", "HTTP RestTemplate")
    Rel(eventSvc, dbEvents, "save y find en event, room y outbox_event", "JDBC")
    Rel(tierSvc, dbEvents, "save y find en tier e idempotency_key", "JDBC")
    Rel(seatSvc, dbEvents, "save y find en seat", "JDBC")
```

---

### 📍 Nivel 3 — Componentes: ms-ticketing

```mermaid
C4Component
    title Diagrama C4 · L3: Componentes de ms-ticketing

    Container_Boundary(tk, "ms-ticketing — :8082") {
        Component(reservCtrl, "ReservationController", "REST Controller · /api/v1/reservations/**", "Crear reserva PENDING con TTL de 10 min, procesar pago MOCK con máximo 3 intentos, consultar reserva. Soporta usuario autenticado y guest anónimo.")
        Component(ticketCtrl, "TicketController", "REST Controller · /api/v1/tickets/**", "Listar tickets del comprador paginado, descargar PDF, endpoint de stats para ms-events.")
        Component(reservSvc, "ReservationService", "Spring Service · @Version Optimistic Locking", "Core del negocio: crear reserva, procesar pago MOCK, transición de estados, expiración masiva por evento cancelado.")
        Component(msEventsInt, "MsEventsIntegrationService", "HTTP Client · WebClient · Retry 2 x 200ms", "GET detalle de evento y PATCH quota de tier en ms-events con header X-Service-Auth y X-Idempotency-Key.")
        Component(fraudSvc, "FraudService", "Spring Service", "Detecta patrones de fraude por buyer_id y event_id. Persiste registros en fraud_log.")
        Component(expirationProc, "ReservationExpirationProcessor", "@Scheduled", "Busca reservas PENDING con validUntilAt menor a now() y las expira, disparando publicación de ticket.expired.")
        Component(outboxScheduler, "OutboxPublisherScheduler", "@Scheduled · Outbox Pattern", "Publica mensajes PENDING de outbox_event a tickets.exchange.")
        Component(eventCancelledListener, "EventCancelledListener", "@RabbitListener · ticketing.event.cancelled", "Consume event.cancelled y expira todas las reservas PENDING del evento cancelado.")
        Component(ticketAssocListener, "TicketAssociationListener", "@RabbitListener · ticketing.user.registered", "Consume user.registered y asocia tickets de sesión guest al userId registrado.")
        Component(pdfService, "PdfService", "Spring Service", "Genera PDF del ticket con datos de evento, tier, asiento, transacción y timestamp.")
    }

    ContainerDb(dbTicketing, "db-ticketing", "ticket_db", "")
    ContainerQueue(rabbitmqIn, "RabbitMQ consume", "event.cancelled · user.registered", "")
    ContainerQueue(rabbitmqOut, "RabbitMQ publish", "ticket.paid · failed · expired", "")
    Container(msEvents, "ms-events", ":8081", "")

    Rel(reservCtrl, reservSvc, "createReservation, processPayment, getReservation")
    Rel(ticketCtrl, pdfService, "generatePdf(ticketId)")
    Rel(reservSvc, msEventsInt, "getEventDetail, decrementTierQuota, incrementTierQuota")
    Rel(reservSvc, fraudSvc, "checkFraud(buyerId, eventId)")
    Rel(reservSvc, dbTicketing, "save y find en reservation, ticket y outbox_event", "JDBC")
    Rel(expirationProc, reservSvc, "expireReservationsByTTL()")
    Rel(eventCancelledListener, reservSvc, "expireReservationsByEvent(eventId)")
    Rel(outboxScheduler, rabbitmqOut, "convertAndSend ticket.paid, failed y expired", "AMQP")
    Rel(eventCancelledListener, rabbitmqIn, "basicAck y basicNack", "AMQP")
    Rel(ticketAssocListener, rabbitmqIn, "basicAck y basicNack", "AMQP")
    Rel(msEventsInt, msEvents, "GET /events/{id} y PATCH /tiers/{id}/quota", "HTTP WebClient")
```

---

### 📍 Nivel 3 — Componentes: ms-notifications

```mermaid
C4Component
    title Diagrama C4 · L3: Componentes de ms-notifications

    Container_Boundary(nt, "ms-notifications — :8083") {
        Component(notifCtrl, "NotificationController", "REST Controller · /api/v1/notifications/**", "Lista notificaciones por comprador paginado, cuenta no leídas, marca como leídas y archiva. Confía en X-User-Id inyectado por gateway.")
        Component(notifSvc, "NotificationService", "Spring Service", "Crea notificaciones idempotentes sin duplicados por reservationId más tipo. Lista, marca leídas y archiva para un buyerId.")
        Component(paidConsumer, "TicketPaidConsumer", "@RabbitListener · ticketing.ticket.paid · Manual ACK", "Consume TicketPaidEvent y crea Notification PAYMENT_SUCCESS. basicNack en fallo enruta a DLQ.")
        Component(failedConsumer, "TicketPaymentFailedConsumer", "@RabbitListener · ticketing.ticket.failed · Manual ACK", "Consume TicketPaymentFailedEvent y crea Notification PAYMENT_FAILED. basicNack a DLQ.")
        Component(expiredConsumer, "TicketExpiredConsumer", "@RabbitListener · ticketing.ticket.expired · Manual ACK", "Consume TicketExpiredEvent y crea Notification TICKET_EXPIRED. basicNack a DLQ.")
        Component(cancelledConsumer, "EventCancelledConsumer", "@RabbitListener · notifications.event.cancelled", "Consume EventCancelledMessage y crea Notification EVENT_CANCELLED para compradores afectados.")
        Component(notifRepo, "NotificationRepository", "Spring Data JPA", "Persistencia de Notification con índices en buyer_id, status y created_at.")
    }

    ContainerDb(dbNotif, "db-notifications", "notif_db", "")
    ContainerQueue(rabbitmq, "RabbitMQ", "tickets.exchange · events.exchange", "")

    Rel(notifCtrl, notifSvc, "getByBuyerId, markAllRead, archiveAll, countUnread")
    Rel(notifSvc, notifRepo, "save, findByBuyerId, updateStatus")
    Rel(paidConsumer, notifSvc, "createIfNotExists(reservationId, PAYMENT_SUCCESS)")
    Rel(failedConsumer, notifSvc, "createIfNotExists(reservationId, PAYMENT_FAILED)")
    Rel(expiredConsumer, notifSvc, "createIfNotExists(reservationId, TICKET_EXPIRED)")
    Rel(cancelledConsumer, notifSvc, "createIfNotExists(eventId, EVENT_CANCELLED)")
    Rel(paidConsumer, rabbitmq, "basicAck o basicNack hacia DLQ", "AMQP")
    Rel(failedConsumer, rabbitmq, "basicAck o basicNack hacia DLQ", "AMQP")
    Rel(expiredConsumer, rabbitmq, "basicAck o basicNack hacia DLQ", "AMQP")
    Rel(notifRepo, dbNotif, "SQL queries", "JDBC")
```

---

### 📍 Nivel 3 — Componentes: Frontend SPA

```mermaid
C4Component
    title Diagrama C4 · L3: Componentes del Frontend SPA

    Container_Boundary(fe, "Frontend SPA — React 19 (Nginx :80 / Vite dev :5173)") {
        Component(apiClient, "apiClient (Axios)", "Axios instance · interceptors JWT y guest", "Cliente HTTP base. Inyecta JWT Bearer, X-Role y X-User-Id autenticado o guest UUID. Redirige a login en 401.")
        Component(authCtx, "AuthContext / useAuth", "React Context + Hook", "Estado global de sesión: token, userId, role, email. login y logout con sessionStorage.")
        Component(notifPolling, "useNotificationPolling", "Custom Hook · polling periódico", "Consulta el unread-count cada N segundos. Actualiza badge en la barra de navegación.")
        Component(cartWatcher, "useCartExpirationWatcher", "Custom Hook", "Observa el TTL de reservas activas en el carrito. Purga entradas expiradas y alerta al usuario.")
        Component(buyerPages, "Páginas Comprador", "React Components", "CarteleraPage, EventDetail con flujo Checkout, Payment, Success y Failure, CartPage, MyTicketsPage, ProfilePage, BuyerLoginPage, BuyerRegisterPage y VenuesPage.")
        Component(adminPages, "Páginas Administrador", "React Components · AdminGuard", "EventsDashboard, CreateEventPage, EditEventPage, EventDetailAdmin con gestión de tiers y RoomsAdminPage. Protegidas por rol ADMIN.")
        Component(seatMap, "SeatMap hooks y components", "Custom Hooks · React", "useSeatMapAPI y useSeatSelection: carga disponibilidad y gestiona selección visual de asientos por tier.")
        Component(services, "Capa de Servicios", "TypeScript modules · Axios", "authService, eventService, adminEventService, reservationService, ticketService, notificationService, venueService y seatMapService.")
    }

    Container(gateway, "API Gateway", ":8080", "")

    Rel(buyerPages, apiClient, "Llamadas REST en flujos públicos y BUYER")
    Rel(adminPages, apiClient, "Llamadas REST en flujos ADMIN")
    Rel(authCtx, apiClient, "Gestiona token en sessionStorage")
    Rel(notifPolling, apiClient, "GET /api/v1/notifications/buyer/{id}/unread-count")
    Rel(cartWatcher, apiClient, "GET /api/v1/reservations/{id}")
    Rel(seatMap, apiClient, "GET /api/v1/events/{id}/seats")
    Rel(services, apiClient, "Todas las llamadas usan la instancia base con interceptores")
    Rel(apiClient, gateway, "HTTP REST con JWT Bearer y X-User-Id", "HTTP :8080")
```

---

### 📍 Nivel 4 — Modelo de Datos por Bounded Context

#### gateway_db · notif_db

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string password_hash
        string role
        datetime created_at
        datetime updated_at
    }
    NOTIFICATION {
        uuid id PK
        uuid reservation_id
        uuid event_id
        uuid buyer_id
        string type
        string status
        string message
        string event_name
        datetime created_at
    }
```

#### events_db

```mermaid
erDiagram
    ROOM {
        uuid id PK
        string name
        int max_capacity
    }
    EVENT {
        uuid id PK
        uuid room_id FK
        string title
        string description
        datetime date
        int capacity
        string status
        string created_by
        bool is_featured
        bool is_limited
        bool enable_seats
    }
    TIER {
        uuid id PK
        uuid event_id FK
        string type
        decimal price
        int quota
        int available_quota
        datetime early_bird_valid_until
    }
    SEAT {
        uuid id PK
        uuid event_id FK
        uuid tier_id FK
        string row
        int number
        string status
    }

    ROOM ||--o{ EVENT : "aloja"
    EVENT ||--o{ TIER : "tiene"
    EVENT ||--o{ SEAT : "contiene"
    TIER ||--o{ SEAT : "asigna"
```

#### ticket_db

```mermaid
erDiagram
    RESERVATION {
        uuid id PK
        uuid event_id
        uuid tier_id
        uuid buyer_id
        string status
        datetime valid_until_at
        int payment_attempts
        string buyer_email
        long version
    }
    TICKET {
        uuid id PK
        uuid reservation_id UK
        uuid buyer_id
        uuid event_id
        uuid tier_id
        string tier_type
        decimal price
        string status
        uuid seat_id
        string seat_row
        int seat_number
        datetime paid_at
    }
    SEAT_RESERVATION {
        uuid id PK
        uuid reservation_id FK
        uuid seat_id
    }
    FRAUD_LOG {
        uuid id PK
        uuid buyer_id
        uuid event_id
        string status
        datetime created_at
    }

    RESERVATION ||--o{ SEAT_RESERVATION : "bloquea"
    RESERVATION ||--|| TICKET : "genera al pagar"
    RESERVATION ||--o{ FRAUD_LOG : "registra"
```

---

## 🌌 Ecosistema de Repositorios

El proyecto sigue una estrategia de separación de responsabilidades con repositorios satélite dedicados a la validación automatizada:

| Perfil / Dominio | Repositorio | Evidencia en Vivo |
|---|---|---|
| 🏗️ **Backend + Frontend (esta app)** | [🔗 **TICKETING_SEM7**](https://github.com/ChristopherPalloArias/TICKETING_SEM7) | *Microservicios, API Gateway, React SPA* |
| 🥋 **Certificación Funcional API** | [🔗 **TICKETING_SEM7_KARATE**](https://github.com/ChristopherPalloArias/TICKETING_SEM7_KARATE) | [🌐 Dashboard Karate](https://christopherpalloarias.github.io/TICKETING_SEM7_KARATE/) |
| 🚀 **Pruebas de Carga (SLA)** | [🔗 **TICKETING_SEM7_K6**](https://github.com/ChristopherPalloArias/TICKETING_SEM7_K6) | [🌐 Informe k6](https://christopherpalloarias.github.io/TICKETING_SEM7_K6/) |
| 🥒 **Pruebas BDD (Funcional UI)** | [🔗 **TICKETING_SEM7_SERENITY**](https://github.com/ChristopherPalloArias/TICKETING_SEM7_SERENITY) | [🌐 Reporte Serenity](https://christopherpalloarias.github.io/TICKETING_SEM7_SERENITY/) |

---

## ⚡ Quick Start

### Prerrequisitos

- **Docker** + **Docker Compose** v2+
- **Node.js** 20+ y **npm** 9+
- **Git**

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd TICKETING_SEM7
```

### 2. Configurar variables de entorno

```bash
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

Edita `.env` y reemplaza los placeholders:

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciales de PostgreSQL |
| `ADMIN_EMAIL` | Email del administrador |
| `ADMIN_PASSWORD` | Contraseña admin (mínimo 12 caracteres) |
| `JWT_SECRET` | Clave JWT de al menos 32 caracteres para HMAC-SHA256 |

> **Seguridad:** Nunca uses los valores de ejemplo en producción. El sistema valida `JWT_SECRET` ≥ 32 chars y `ADMIN_PASSWORD` ≥ 12 chars al arrancar.

### 3. Levantar backend + infraestructura

```bash
docker compose up -d
```

Flyway ejecuta las migraciones automáticamente y carga **4 eventos de demo**. Espera a que todos los contenedores estén `healthy` (~1-2 min).

### 4. Levantar frontend

```bash
# Windows PowerShell
npm --prefix frontend install
npm --prefix frontend run dev
```

### 5. Acceder al sistema

| Recurso | URL |
|---------|-----|
| Cartelera (comprador) | http://localhost:5173/eventos |
| Panel Admin | http://localhost:5173/login |
| API Gateway | http://localhost:8080/api/v1/ |
| RabbitMQ Management | http://localhost:15672 |

El administrador se crea automáticamente con los valores de `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`.

---

## 🎟️ Datos de Demo

La migración `V7__seed_demo_data.sql` carga automáticamente al arrancar:

| # | Evento | Sala | Capacidad | Tiers | Precio desde |
|---|--------|------|-----------|-------|-------------|
| 1 | **BODAS DE SANGRE** | Teatro Real (Madrid) | 200 | GENERAL, VIP | $75 |
| 2 | **The Phantom's Echo** | Grand Opera House | 400 | GENERAL, VIP, EARLY_BIRD | $95 |
| 3 | **Midnight Jazz Ritual** | The Velvet Lounge | 80 | GENERAL, VIP | $45 |
| 4 | **Kinetic Shadows** | Arts Center | 120 | GENERAL, VIP | $35 |

---

## 📊 Cobertura de Tests

### Backend (JUnit 5 + Spring Boot Test)

```bash
cd api-gateway     && ./gradlew test
cd ms-events       && ./gradlew test
cd ms-ticketing    && ./gradlew test
cd ms-notifications && ./gradlew test
```

| Módulo | Tests |
|--------|-------|
| api-gateway | 33 |
| ms-events | 52 |
| ms-ticketing | 6 |
| ms-notifications | 48 |
| **Total** | **139** |

### Frontend (Vitest + Testing Library)

```bash
cd frontend && npm test
```

| | |
|-|-|
| Archivos de test | 45 |
| Tests totales | 182 |

---

## 🧭 ¿Cómo Auditar Este Proyecto?

1. **Arquitectura:** Navega los diagramas C4 de este README — de Contexto a Código — para entender la estructura distribuida completa del sistema.
2. **Contratos de mensajería:** Revisa [`docs/c4-audit-matrix.md`](./docs/c4-audit-matrix.md) para la matriz completa de exchanges, routing keys, queues y DLQs de RabbitMQ.
3. **Capa Funcional API:** Ingresa al dashboard de **[Karate DSL](https://christopherpalloarias.github.io/TICKETING_SEM7_KARATE/)** para la certificación de reglas de negocio y protección contra sobreventas a nivel backend.
4. **Capa Funcional UI (BDD):** Navega el reporte de **[Serenity BDD](https://christopherpalloarias.github.io/TICKETING_SEM7_SERENITY/)** para la automatización E2E del flujo de compra desde el frontend React usando el patrón Screenplay.
5. **Rendimiento y Tolerancia:** Analiza el informe **[k6](https://christopherpalloarias.github.io/TICKETING_SEM7_K6/)** para verificar los SLAs bajo carga concurrente real (reservas simultáneas, scheduler bajo presión).