---
id: SPEC-013
status: DRAFT
feature: seed-demo-data
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: [SPEC-011]
---

# Spec: Seed Data de Demo y README de Arranque

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Creación de una migración Flyway V7 con datos seed de demostración (4 salas, 4 eventos con metadata artística completa, 2-3 tiers por evento) y actualización del README.md de la raíz del proyecto con instrucciones de arranque rápido, URLs de acceso, credenciales de demo y descripción de la arquitectura. El objetivo es que el sistema de ticketing sea funcional como demo desde el primer arranque sin necesidad de crear datos manualmente.

### Requerimiento de Negocio
Fuente: `.github/requirements/integracion-admin-frontend.md` — HU-INT-04.

Como Desarrollador / Evaluador de demo, necesito que al levantar el sistema por primera vez existan 4 eventos de ejemplo con imagen, metadata artística, tiers configurados y estado PUBLISHED, junto con un README que documente el flujo completo de arranque. Esto permite ver una cartelera funcional y atractiva inmediatamente sin configuración manual.

### Historias de Usuario

#### HU-01: Seed data de demo con 4 eventos funcionales

```
Como:        Desarrollador / Evaluador de demo
Quiero:      que al levantar el sistema por primera vez existan 4 eventos de ejemplo con imagen, metadata artística, tiers configurados y estado PUBLISHED
Para:        poder ver una cartelera funcional y atractiva inmediatamente sin necesidad de crear datos manualmente

Prioridad:   Alta
Estimación:  S (3 SP)
Dependencias: SPEC-011 (V6__add_event_metadata_fields.sql debe existir)
Capa:        Backend (migración SQL) + Documentación (README)
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Datos de demo disponibles tras levantar el sistema
  Dado que:  la base de datos de ms-events está vacía
  Cuando:    Flyway ejecuta las migraciones al arrancar el servicio
  Entonces:  existen 4 rooms: "Teatro Real" (300), "Grand Opera House" (500), "The Velvet Lounge" (100), "Arts Center" (150)
  Y          existen 4 eventos con status PUBLISHED y metadata completa (imageUrl, subtitle, location, director, cast_members, duration, tag)
  Y          cada evento tiene al menos 2 tiers configurados con precios y cupos
  Y          los eventos con isFeatured=true son "BODAS DE SANGRE" y "The Phantom's Echo"
  Y          el evento "Kinetic Shadows" tiene isLimited=true
```

```gherkin
CRITERIO-1.2: Fechas de demo siempre vigentes
  Dado que:  la migración seed se ejecuta en cualquier fecha
  Cuando:    inserta los eventos demo
  Entonces:  las fechas de evento son calculadas como NOW() + INTERVAL (30, 45, 60, 20 días)
  Y          los eventos siempre aparecen como futuros en la cartelera
```

```gherkin
CRITERIO-1.3: Cartelera pública funcional tras solo docker-compose up
  Dado que:  el evaluador clona el repositorio
  Cuando:    ejecuta docker-compose up y npm run dev
  Entonces:  la base de datos se crea y se puebla automáticamente con los datos seed
  Y          la cartelera en /eventos muestra los 4 eventos con imágenes, badges y precios
  Y          el detalle de cualquier evento muestra director, elenco, duración y tiers disponibles
```

**Edge Case**
```gherkin
CRITERIO-1.4: Idempotencia del seed (Flyway versionado)
  Dado que:  el sistema ya fue arrancado y los datos seed existen
  Cuando:    el servicio se reinicia y Flyway ejecuta migraciones
  Entonces:  la migración V7 no se ejecuta otra vez (Flyway versioned migration)
  Y          los datos de demo permanecen intactos
```

#### HU-02: README con instrucciones de arranque rápido

```
Como:        Desarrollador / Evaluador de demo
Quiero:      un README completo con instrucciones de arranque, URLs de acceso, credenciales de demo y descripción de arquitectura
Para:        poder levantar y usar el sistema sin conocimiento previo del proyecto

Prioridad:   Media
Estimación:  XS
Dependencias: Ninguna
Capa:        Documentación
```

#### Criterios de Aceptación — HU-02

```gherkin
CRITERIO-2.1: README documenta el flujo completo de arranque
  Dado que:  un evaluador lee el README.md de la raíz del proyecto
  Cuando:    busca instrucciones de arranque
  Entonces:  encuentra una sección "Quick Start" con prerrequisitos, comandos de arranque, URLs y credenciales
```

```gherkin
CRITERIO-2.2: README documenta arquitectura y puertos
  Dado que:  un desarrollador lee el README.md
  Cuando:    busca la arquitectura del sistema
  Entonces:  encuentra un diagrama ASCII con los servicios y sus puertos
```

### Reglas de Negocio
1. La migración V7 debe ejecutarse después de V6 (los campos de metadata deben existir).
2. Todos los eventos seed deben tener `status = 'PUBLISHED'` para aparecer en la cartelera pública.
3. `event.capacity` no puede exceder `room.max_capacity` de la sala asignada.
4. Las fechas de evento deben ser futuras (`NOW() + INTERVAL`) para cumplir el constraint `event_date_future`.
5. Cada tier tiene constraint `UNIQUE(event_id, tier_type)` — no repetir tipos por evento.
6. Los tiers EARLY_BIRD deben incluir `valid_from` y `valid_until` no nulos.
7. El seed usa `gen_random_uuid()` para generar UUIDs (requiere PostgreSQL 13+).

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `room` | tabla `room` | INSERT 4 registros | Salas para los eventos demo |
| `event` | tabla `event` | INSERT 4 registros | Eventos con metadata completa (depende de V6) |
| `tier` | tabla `tier` | INSERT 10 registros | Tiers con precios y cupos por evento |

#### Datos de rooms a insertar
| Nombre | max_capacity |
|--------|-------------|
| Teatro Real | 300 |
| Grand Opera House | 500 |
| The Velvet Lounge | 100 |
| Arts Center | 150 |

#### Datos de eventos a insertar
| # | Título | Sala | Capacidad | Duración | Fecha | isFeatured | isLimited |
|---|--------|------|-----------|----------|-------|------------|-----------|
| 1 | BODAS DE SANGRE | Teatro Real | 200 | 120 | NOW()+30d | true | false |
| 2 | The Phantom's Echo | Grand Opera House | 400 | 150 | NOW()+45d | true | false |
| 3 | Midnight Jazz Ritual | The Velvet Lounge | 80 | 90 | NOW()+60d | false | false |
| 4 | Kinetic Shadows | Arts Center | 120 | 75 | NOW()+20d | false | true |

#### Datos de tiers a insertar
| Evento | Tier Type | Precio | Cupo | valid_from | valid_until |
|--------|-----------|--------|------|------------|-------------|
| BODAS DE SANGRE | GENERAL | 75.00 | 150 | NULL | NULL |
| BODAS DE SANGRE | VIP | 120.00 | 50 | NULL | NULL |
| The Phantom's Echo | GENERAL | 120.00 | 300 | NULL | NULL |
| The Phantom's Echo | VIP | 200.00 | 80 | NULL | NULL |
| The Phantom's Echo | EARLY_BIRD | 95.00 | 20 | NOW() | NOW()+15d |
| Midnight Jazz Ritual | GENERAL | 45.00 | 60 | NULL | NULL |
| Midnight Jazz Ritual | VIP | 85.00 | 20 | NULL | NULL |
| Kinetic Shadows | GENERAL | 35.00 | 100 | NULL | NULL |
| Kinetic Shadows | VIP | 65.00 | 20 | NULL | NULL |

### Migración SQL Completa

Archivo: `ms-events/src/main/resources/db/migration/V7__seed_demo_data.sql`

```sql
-- ============================================================
-- V7__seed_demo_data.sql
-- Seed data: 4 rooms, 4 events (PUBLISHED), 9 tiers
-- Depends on: V6__add_event_metadata_fields.sql (SPEC-011)
-- ============================================================

-- -------------------------------------------------------
-- 1. ROOMS
-- -------------------------------------------------------
INSERT INTO room (id, name, max_capacity, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Teatro Real',        300, NOW(), NOW()),
  (gen_random_uuid(), 'Grand Opera House',  500, NOW(), NOW()),
  (gen_random_uuid(), 'The Velvet Lounge',  100, NOW(), NOW()),
  (gen_random_uuid(), 'Arts Center',        150, NOW(), NOW());

-- -------------------------------------------------------
-- 2. EVENTS (reference rooms by name)
-- -------------------------------------------------------

-- Evento 1: BODAS DE SANGRE
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  tag, is_limited, is_featured, author,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'Teatro Real'),
  'BODAS DE SANGRE',
  'Una tragedia en verso y prosa donde el deseo choca contra las leyes no escritas del honor y la tierra. En esta nueva visión de Teatro Noir, la obra de Lorca se transforma en un thriller visual de sombras prolongadas y pasiones eléctricas.',
  NOW() + INTERVAL '30 days',
  200,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/theater/1200/800',
  'Federico García Lorca',
  'TEATRO REAL, MADRID',
  'Alejandro G. Iñárritu',
  'Penélope Cruz, Javier Bardem',
  120,
  'FEATURED PERFORMANCE',
  false,
  true,
  'Federico García Lorca',
  NOW(), NOW()
);

-- Evento 2: The Phantom's Echo
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  tag, is_limited, is_featured,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'Grand Opera House'),
  'The Phantom''s Echo',
  'A dramatic wide shot of a stage performance with a lone cellist in a spotlight and deep shadows in a grand theater.',
  NOW() + INTERVAL '45 days',
  400,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/opera/1200/800',
  'A Noir Opera Experience',
  'GRAND OPERA HOUSE',
  'Christopher Nolan',
  'Cillian Murphy',
  150,
  'FEATURED PERFORMANCE',
  false,
  true,
  NOW(), NOW()
);

-- Evento 3: Midnight Jazz Ritual
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  is_limited, is_featured,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'The Velvet Lounge'),
  'Midnight Jazz Ritual',
  'Dark moody atmosphere of a jazz club with golden lighting highlighting brass instruments and soft smoke swirls.',
  NOW() + INTERVAL '60 days',
  80,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/jazz/1200/800',
  'An Intimate Jazz Session',
  'THE VELVET LOUNGE',
  'Damien Chazelle',
  'Ryan Gosling',
  90,
  false,
  false,
  NOW(), NOW()
);

-- Evento 4: Kinetic Shadows
INSERT INTO event (
  id, room_id, title, description, date, capacity, status, created_by,
  image_url, subtitle, location, director, cast_members, duration,
  tag, is_limited, is_featured,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM room WHERE name = 'Arts Center'),
  'Kinetic Shadows',
  'Minimalist modern dance composition with high contrast lighting on a dark stage showing two silhouettes in motion.',
  NOW() + INTERVAL '20 days',
  120,
  'PUBLISHED',
  'seed-migration',
  'https://picsum.photos/seed/dance/1200/800',
  'Contemporary Dance Exhibition',
  'ARTS CENTER',
  'Sidi Larbi Cherkaoui',
  'Modern Dance Ensemble',
  75,
  'LIMITED SEATING',
  true,
  false,
  NOW(), NOW()
);

-- -------------------------------------------------------
-- 3. TIERS
-- -------------------------------------------------------

-- Tiers for BODAS DE SANGRE
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'BODAS DE SANGRE'), 'GENERAL', 75.00, 150, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'BODAS DE SANGRE'), 'VIP', 120.00, 50, NULL, NULL, 0, NOW(), NOW());

-- Tiers for The Phantom's Echo
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'The Phantom''s Echo'), 'GENERAL', 120.00, 300, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'The Phantom''s Echo'), 'VIP', 200.00, 80, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'The Phantom''s Echo'), 'EARLY_BIRD', 95.00, 20, NOW(), NOW() + INTERVAL '15 days', 0, NOW(), NOW());

-- Tiers for Midnight Jazz Ritual
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Midnight Jazz Ritual'), 'GENERAL', 45.00, 60, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Midnight Jazz Ritual'), 'VIP', 85.00, 20, NULL, NULL, 0, NOW(), NOW());

-- Tiers for Kinetic Shadows
INSERT INTO tier (id, event_id, tier_type, price, quota, valid_from, valid_until, version, created_at, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Kinetic Shadows'), 'GENERAL', 35.00, 100, NULL, NULL, 0, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM event WHERE title = 'Kinetic Shadows'), 'VIP', 65.00, 20, NULL, NULL, 0, NOW(), NOW());
```

### README Sections to Add

The following sections should be added/replaced in the root `README.md`:

#### Complete README Content

````markdown
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

# Copiar variables de entorno (si no existe .env)
# cp .env.example .env

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
````

### API Endpoints

> No se crean ni modifican endpoints en esta spec. La migración V7 es solo data seed.

### Diseño Frontend

> No se crean ni modifican componentes frontend en esta spec. Solo se documenta en el README.

### Arquitectura y Dependencias
- **Dependencia crítica:** SPEC-011 (V6__add_event_metadata_fields.sql) debe estar implementada — V7 inserta datos en las columnas creadas por V6.
- **No se agregan dependencias de código** (ni paquetes Java ni npm).
- **PostgreSQL 13+** requerido por `gen_random_uuid()`.

### Notas de Implementación
> - La migración V7 usa subqueries `(SELECT id FROM room WHERE name = '...')` para vincular eventos a rooms por nombre. Esto es seguro porque los rooms se insertan en la misma migración y los nombres son únicos.
> - El título `The Phantom's Echo` contiene una comilla simple — se escapa como `''` en SQL.
> - Evento 3 (Midnight Jazz Ritual) no tiene `tag` ni `author` — esos campos son nullables y se omiten del INSERT.
> - Evento 2 (The Phantom's Echo) no tiene `author` — se omite del INSERT.
> - El tier EARLY_BIRD tiene `valid_from = NOW()` y `valid_until = NOW() + 15 days`, lo cual cumple el constraint `early_bird_dates_consistency`.
> - La columna `version` del tier (V3) se inicializa en `0`.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### Implementación
- [ ] Verificar que SPEC-011 (V6) está implementada — las columnas de metadata deben existir en la tabla `event`
- [ ] Crear migración `V7__seed_demo_data.sql` en `ms-events/src/main/resources/db/migration/`
- [ ] INSERT de 4 rooms: Teatro Real (300), Grand Opera House (500), The Velvet Lounge (100), Arts Center (150)
- [ ] INSERT de 4 events con TODOS los campos de metadata y status=PUBLISHED
- [ ] INSERT de 9 tiers (2-3 por evento) con precios, cupos y vigencia (EARLY_BIRD)
- [ ] Verificar que fechas usan `NOW() + INTERVAL 'X days'` para ser siempre futuras
- [ ] Verificar que `event.capacity <= room.max_capacity` para cada evento
- [ ] Verificar compatibilidad con constraints: `UNIQUE(title, date)`, `event_date_future`, `UNIQUE(event_id, tier_type)`, `early_bird_dates_consistency`
- [ ] Probar migración limpia en PostgreSQL local o con `docker-compose up`

#### Tests Backend
- [ ] Verificar que Flyway ejecuta V7 sin errores en arranque limpio
- [ ] Verificar que existen 4 rooms, 4 events y 9 tiers después de la migración
- [ ] Verificar que `GET /api/v1/events` devuelve los 4 eventos con metadata completa
- [ ] Verificar que el seed no se re-ejecuta en reinicios (idempotencia Flyway)

### Frontend

> No hay cambios de código frontend en esta spec.

### Documentación

#### README
- [ ] Reemplazar contenido de `README.md` en la raíz del proyecto
- [ ] Sección **Quick Start**: prerrequisitos, docker-compose up, npm run dev
- [ ] Sección **Datos de Demo**: tabla con los 4 eventos y sus características
- [ ] Sección **Arquitectura**: diagrama ASCII con servicios y puertos
- [ ] Sección **Stack Tecnológico**: backend, mensajería, frontend, infraestructura
- [ ] URLs de acceso: cartelera (localhost:5173/eventos), admin (localhost:5173/admin/login)
- [ ] Credenciales admin demo: admin@sem7.com / admin123

### QA
- [ ] Ejecutar `docker-compose up` desde cero → verificar cartelera con 4 eventos funcionales
- [ ] Verificar que cada evento muestra imagen, badges (Featured/Limited), precios y tiers
- [ ] Verificar que el detalle de cada evento muestra director, elenco, duración
- [ ] Verificar que al reiniciar servicios los datos seed no se duplican
- [ ] Verificar que el README tiene instrucciones claras y funcionales
- [ ] Verificar que las URLs documentadas en el README son correctas y accesibles
