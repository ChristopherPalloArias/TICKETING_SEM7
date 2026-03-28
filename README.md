# Ticketing System — Semillero 7

Sistema de ticketing para eventos de artes escénicas. Arquitectura de microservicios con Java 17, Spring Boot 3.2, PostgreSQL, RabbitMQ y frontend React 19.

---

## Quick Start

### Prerrequisitos

- **Docker** + **Docker Compose** v2+
- **Node.js** 18+ y **npm** 9+

### 1. Levantar backend + infraestructura

```bash
# Clonar el repositorio
git clone <repo-url> && cd TICKETING_SEM7

# Levantar todos los servicios
docker-compose up -d
```

Esto arranca: PostgreSQL (×3), RabbitMQ, ms-events, ms-ticketing, ms-notifications y api-gateway.
Flyway ejecuta las migraciones automáticamente y carga los **4 eventos de demo**.

### 2. Levantar frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Acceder al sistema

| Recurso | URL |
|---------|-----|
| Cartelera (comprador) | http://localhost:5173/eventos |
| Panel Admin | http://localhost:5173/admin/login |
| API Gateway | http://localhost:8080/api/v1/ |
| RabbitMQ Management | http://localhost:15672 |

### Credenciales de demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@sem7.com | admin123 |

---

## Datos de Demo

Al arrancar por primera vez, la migración `V7__seed_demo_data.sql` carga automáticamente:

| # | Evento | Sala | Capacidad | Tiers | Precio desde |
|---|--------|------|-----------|-------|-------------|
| 1 | **BODAS DE SANGRE** | Teatro Real (Madrid) | 200 | GENERAL, VIP | $75 |
| 2 | **The Phantom's Echo** | Grand Opera House | 400 | GENERAL, VIP, EARLY_BIRD | $95 |
| 3 | **Midnight Jazz Ritual** | The Velvet Lounge | 80 | GENERAL, VIP | $45 |
| 4 | **Kinetic Shadows** | Arts Center | 120 | GENERAL, VIP | $35 |

- Los eventos 1 y 2 están marcados como **Featured** (destacados en el hero).
- El evento 4 está marcado como **Limited** (aforo limitado).
- Las fechas se calculan como `NOW() + intervalo`, por lo que siempre son futuras.
- Las imágenes provienen de [picsum.photos](https://picsum.photos) (requiere conexión a internet).

---

## Arquitectura

```
┌─────────────┐      ┌──────────────┐
│   Frontend   │─────▶│  API Gateway  │
│  React 19    │      │  :8080        │
│  :5173 (dev) │      └──────┬───────┘
└─────────────┘             │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │ms-events │ │ms-ticket.│ │ms-notificat. │
        │  :8081   │ │  :8082   │ │    :8083     │
        └────┬─────┘ └────┬─────┘ └──────┬───────┘
             │             │              │
             ▼             ▼              ▼
        ┌─────────┐  ┌─────────┐   ┌─────────┐
        │PG :5432 │  │PG :5433 │   │PG :5435 │
        │events_db│  │ticket_db│   │notif_db │
        └─────────┘  └─────────┘   └─────────┘
                           │
                      ┌────▼────┐
                      │RabbitMQ │
                      │:5672    │
                      │:15672 UI│
                      └─────────┘
```

### Puertos de servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| PostgreSQL (events) | 5432 | Base de datos de ms-events |
| PostgreSQL (ticketing) | 5433 | Base de datos de ms-ticketing |
| PostgreSQL (notifications) | 5435 | Base de datos de ms-notifications |
| RabbitMQ (AMQP) | 5672 | Mensajería entre microservicios |
| RabbitMQ (Management) | 15672 | UI de gestión de colas |
| ms-events | 8081 | Catálogo de eventos, rooms y tiers |
| ms-ticketing | 8082 | Reservas y pagos simulados |
| ms-notifications | 8083 | Notificaciones por email simulado |
| API Gateway | 8080 | Punto de entrada unificado |
| Frontend (dev) | 5173 | Vite dev server |

---

## Stack Tecnológico

- **Backend:** Java 17, Spring Boot 3.2, Spring Data JPA, Hibernate, PostgreSQL 15, Flyway
- **Mensajería:** RabbitMQ 3.13
- **Frontend:** React 19, TypeScript 5, Vite, Axios, React Router v7, Framer Motion, CSS Modules
- **Infraestructura:** Docker, Docker Compose