# Requerimiento: Backlog Ticketing (HU-01..HU-07)

## Contexto del proyecto

Sistema de venta de entradas para obras de teatro con microservicios Java 17+ y Spring Boot 3.x:
- `api-gateway`: punto de entrada, enrutamiento y CORS
- `ms-events`: catálogo de eventos, aforo y tiers (`VIP`, `General`, `Early Bird`)
- `ms-ticketing`: reservas, pago simulado, expiración automática y eventos RabbitMQ
- `ms-notifications`: consumo de eventos RabbitMQ y envío de notificaciones

Infraestructura objetivo:
- PostgreSQL por microservicio
- RabbitMQ para integración asíncrona
- Docker + Docker Compose
- Gestión de proyecto con GitHub Projects

## Historias de Usuario (orden de desarrollo)

### HU-01: Creación de evento
Como Administrador
Quiero crear un Evento con nombre, descripción, fecha, lugar y aforo
Para publicar obras de teatro disponibles para la venta

### HU-02: Configuración de tiers y precios
Como Administrador
Quiero definir tiers de precio (`VIP`, `General`, `Early Bird`) para un Evento
Para segmentar precios por tipo de entrada

### HU-03: Visualización de eventos y disponibilidad
Como Comprador
Quiero listar Eventos y ver disponibilidad por tier
Para decidir qué entradas comprar

### HU-04: Reserva y compra con pago simulado
Como Comprador
Quiero reservar entradas y confirmar compra con un pago simulado
Para obtener tickets confirmados

### HU-05: Liberación automática por expiración o pago fallido
Como Sistema
Quiero liberar reservas al expirar o fallar el pago
Para restaurar disponibilidad de aforo

### HU-06: Notificaciones al comprador
Como Comprador
Quiero recibir notificaciones después de eventos de negocio relevantes
Para conocer el estado de mi compra o reserva

### HU-07: Visualización de ticket confirmado
Como Comprador
Quiero consultar mi ticket confirmado
Para tener evidencia de compra y acceso al evento

## Notas de dominio

- Usar terminología canónica: `event`, `capacity`, `tier`, `reservation`, `ticket`, `mock payment`, `expiration`, `notification`.
- Mantener `created_at` y `updated_at` en UTC.
- Integración entre microservicios mediante eventos de RabbitMQ.
