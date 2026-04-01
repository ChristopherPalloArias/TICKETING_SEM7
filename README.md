# Ticketing System — Sem 7

Sistema de ticketing para eventos de artes escénicas. Arquitectura de microservicios con Java 17, Spring Boot 3.3, PostgreSQL, RabbitMQ y frontend React 19.

---

## Quick Start

### Prerrequisitos

- **Docker** + **Docker Compose** v2+
- **Node.js** 20+ y **npm** 9+
- **Git**

### 0. Clonar el repositorio

```bash
git clone <repo-url>
cd TICKETING_SEM7
```

### 1. Configurar variables de entorno

Copia los archivos de ejemplo y edita los valores antes de continuar:

```bash
# Linux / macOS
cp .env.example .env
cp frontend/.env.example frontend/.env

# Windows PowerShell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

Abre `.env` y reemplaza **todos** los valores que contienen `_placeholder` o `REPLACE_WITH_`:

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciales compartidas de PostgreSQL |
| `ADMIN_EMAIL` | Email del administrador, ej. `admin@miempresa.com` |
| `ADMIN_PASSWORD` | Contraseña del admin (**mínimo 12 caracteres**) |
| `JWT_SECRET` | Clave JWT de **al menos 32 caracteres** (256 bits) para HMAC-SHA256 |

El archivo `frontend/.env` contiene únicamente `VITE_API_URL=http://localhost:8080` y no requiere cambios para desarrollo local.

> **Seguridad**: Nunca uses los valores de ejemplo en producción. El sistema valida que `JWT_SECRET` tenga al menos 32 bytes y `ADMIN_PASSWORD` al menos 12 caracteres al arrancar.

### 2. Levantar backend + infraestructura

```bash
docker compose up -d
```

Esto arranca: PostgreSQL (×4), RabbitMQ, ms-events, ms-ticketing, ms-notifications y api-gateway.
Flyway ejecuta las migraciones automáticamente y carga los **4 eventos de demo**.

Espera a que todos los contenedores estén `healthy` (~1-2 min) antes de continuar:

```bash
docker ps
```

### 3. Levantar frontend

Desde la raíz del proyecto:

```bash
# Linux / macOS / Git Bash
cd frontend && npm install && npm run dev

# Windows PowerShell
npm --prefix frontend install
npm --prefix frontend run dev
```

### 4. Acceder al sistema

| Recurso | URL |
|---------|-----|
| Cartelera (comprador) | http://localhost:5173/eventos |
| Panel Admin | http://localhost:5173/admin/login |
| API Gateway | http://localhost:8080/api/v1/ |
| RabbitMQ Management | http://localhost:15672 |

### Credenciales de acceso

El administrador se crea automáticamente al arrancar con los valores definidos en `.env`:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | valor de `ADMIN_EMAIL` en `.env` | valor de `ADMIN_PASSWORD` en `.env` |

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

## Seguridad

El sistema implementa las siguientes medidas de seguridad alineadas con OWASP Top 10:

### Autenticación y Autorización
- **JWT** firmado con clave de mínimo 64 caracteres (validado al arranque)
- Contraseñas de administrador mínimo 8 caracteres, configuradas por `.env`
- El gateway inyecta `X-Role` y `X-User-Id` desde el token JWT; los microservicios confían en estos headers y los clientes no pueden falsificarlos
- Filtros de seguridad eliminan `X-Role` y `X-User-Id` de las solicitudes entrantes antes de validar el JWT

### Validación de Entradas
- Anotaciones `@Valid` + `@NotBlank` / `@Size` / `@Min` / `@Future` en todos los DTOs de entrada
- Manejo centralizado de errores con `@RestControllerAdvice` — sin stacktraces en respuestas

### Rate Limiting
- Bucket4j integrado en el API Gateway con límites configurables por IP
- Protección contra fuerza bruta en el endpoint de login

### Cabeceras HTTP de Seguridad
El API Gateway agrega automáticamente las siguientes cabeceras en cada respuesta:

| Cabecera | Valor |
|----------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'self'; ...` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), ...` |
| `X-XSS-Protection` | `0` (delegado a CSP) |

### Patrón Outbox
Los microservicios ms-events y ms-ticketing usan el **Outbox Pattern** para garantizar consistencia entre la base de datos y RabbitMQ — sin mensajes perdidos ante fallos transaccionales.

---

## Tests

### Backend (JUnit 5 + Spring Boot Test)

```bash
cd api-gateway && ./gradlew test
cd ms-events    && ./gradlew test
cd ms-ticketing && ./gradlew test
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

## Stack Tecnológico

- **Backend:** Java 17, Spring Boot 3.3, Spring Data JPA, Hibernate, PostgreSQL 15, Flyway
- **Seguridad:** Spring Security, JWT (jjwt 0.12), Bucket4j 8.10
- **Mensajería:** RabbitMQ 3.13
- **Frontend:** React 19, TypeScript 5.9, Vite 8, Axios, React Router v7, Framer Motion, CSS Modules
- **Tests FE:** Vitest 4.1, Testing Library, jsdom 29
- **Infraestructura:** Docker, Docker Compose