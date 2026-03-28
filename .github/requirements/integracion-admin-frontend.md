# Requerimiento: Integración Backend-Frontend + Panel de Administración

## Contexto del feature

Resultado de la auditoría de coherencia entre el frontend implementado (SPEC-008, SPEC-009, SPEC-010) y el backend existente (ms-events, ms-ticketing). Se identificaron **brechas bloqueantes** que impiden el flujo completo del comprador, además de la ausencia total de un flujo de administración. Este requerimiento cubre:

1. **Extensión del modelo de datos** en ms-events para soportar campos de metadata artística y presentación ya consumidos por el frontend (imageUrl, director, cast, duration, tag, isLimited, author, **subtitle**, **location**, **isFeatured**).
2. **Paginación** en `GET /api/v1/events` que el frontend ya implementa pero el backend ignora.
3. **Correcciones de contrato** entre DTOs del backend y tipos TypeScript del frontend (price como number, RoomResponse completo).
4. **Configuración de desarrollo** (proxy Vite / `.env.local`).
5. **Seed data de demo** — script SQL y README con los 4 eventos mock originales para tener una página funcional desde el primer arranque.
6. **Panel de Administración frontend** — flujo completo para que el Administrador pueda crear eventos, configurar tiers/precios, publicar eventos y gestionar el catálogo.

### Datos mock de referencia (MVP demo)

Los siguientes 4 eventos deben poder cargarse en la base de datos para obtener una cartelera funcional inmediatamente:

| # | Título | Director | Elenco | Duración | Precio base | Sala / Ubicación | Flags |
|---|--------|----------|--------|----------|-------------|-----------------|-------|
| 1 | BODAS DE SANGRE | Alejandro G. Iñárritu | Penélope Cruz, Javier Bardem | 120 min | $75 | Teatro Real, Madrid | isFeatured |
| 2 | The Phantom's Echo | Christopher Nolan | Cillian Murphy | 150 min | $120 | Grand Opera House | isFeatured |
| 3 | Midnight Jazz Ritual | Damien Chazelle | Ryan Gosling | 90 min | $45 | The Velvet Lounge | — |
| 4 | Kinetic Shadows | Sidi Larbi Cherkaoui | Modern Dance Ensemble | 75 min | $35 | Arts Center | isLimited |

**Capas afectadas:** `ms-events/` (backend), `frontend/` (frontend)
**Depende de:** HU-01, HU-02, HU-03 (ms-events ya implementados), SPEC-008, SPEC-009 (frontend implementados)
**Stack backend:** Java 17 · Spring Boot 3.2 · Spring Data JPA · PostgreSQL · Flyway
**Stack frontend:** React 19 · TypeScript 5 · CSS Modules · Vite · Axios · React Router v7 · Framer Motion · lucide-react

---

## Escala de estimación
Fibonacci: 1, 2, 3, 5, 8, 13

## Definition of Ready (DoR)
- Formato Como / Quiero / Para redactado correctamente
- Valor de negocio identificable y claro
- Criterios de aceptación definidos en Gherkin
- Estimación en Story Points asignada
- Historia cargada en el tablero de GitHub Projects

## Definition of Done (DoD)
- Formato Como / Quiero / Para completo y claro
- Criterios de aceptación escritos en Gherkin declarativo
- Escenarios cubren el camino feliz y los casos alternos o límite
- Tasking desglosado desde la perspectiva DEV y QA
- Estimación en Story Points asignada y justificada
- Historia registrada en el tablero de GitHub Projects
- Commit atómico subido al repositorio con mensaje descriptivo

---

## Parte A — Correcciones de Integración Backend-Frontend

### HU-INT-01: Extensión del modelo Event con metadata artística — SP: 5

Como **Comprador**
Quiero que los eventos muestren imagen, subtítulo, ubicación, director, elenco, duración, etiqueta editorial, indicador de aforo limitado e indicador de evento destacado
Para tener contexto visual y artístico completo antes de decidir si compro una entrada

**Microservicio:** `ms-events`
**Dependencia:** HU-01 (entidad Event existente)
**Justificación SP:** Requiere nueva migración Flyway con 10 columnas nuevas, extensión de la entidad JPA, actualización de DTOs (EventDetailResponse + EventCreateRequest), mapeo en el servicio. Media-alta complejidad por cantidad de campos y por modificar el contrato de API existente.

#### Criterios de Aceptación

**CA-01. Campos opcionales de metadata persistidos correctamente**
```gherkin
Escenario: Evento creado con metadata artística completa
  Dado que el administrador tiene acceso habilitado al sistema
  Cuando crea un evento con imageUrl, subtitle, location, director, cast, duration, tag, isLimited, isFeatured y author
  Entonces el sistema persiste todos los campos junto con los obligatorios
  Y la respuesta incluye los campos de metadata completos
```

**CA-02. Campos de metadata son opcionales**
```gherkin
Escenario: Evento creado sin metadata artística
  Dado que el administrador crea un evento con solo los campos obligatorios (título, descripción, fecha, aforo, sala)
  Cuando no proporciona imageUrl, subtitle, location, director, cast, duration, tag, isLimited, isFeatured ni author
  Entonces el sistema crea el evento normalmente
  Y los campos de metadata se devuelven como null en la respuesta (booleanos como false)
```

**CA-03. Metadata visible en el listado de eventos publicados**
```gherkin
Escenario: Campos de metadata incluidos en GET /api/v1/events
  Dado que existen eventos publicados con metadata artística
  Cuando el comprador consulta la cartelera
  Entonces cada evento en la respuesta incluye imageUrl, subtitle, location, tag, isLimited e isFeatured (si los tiene definidos)
  Y el frontend puede renderizar badges, subtítulos e imágenes sin errores
```

**CA-04. Metadata visible en el detalle del evento**
```gherkin
Escenario: Campos de metadata incluidos en GET /api/v1/events/:id
  Dado que existe un evento publicado con metadata artística completa
  Cuando el comprador consulta el detalle del evento
  Entonces la respuesta incluye imageUrl, subtitle, location, director, cast, duration, tag, isLimited, isFeatured y author
  Y el frontend renderiza el hero, subtítulo, ubicación, tarjetas de director/elenco y badges correctamente
```

**CA-05. Duration como entero en minutos**
```gherkin
Escenario: Duración validada como entero positivo
  Dado que el administrador asigna una duración al evento
  Cuando proporciona un valor entero positivo (ej. 120)
  Entonces el sistema lo persiste correctamente
  Cuando proporciona un valor negativo o cero
  Entonces el sistema rechaza la creación con error de validación
```

#### Subtasks

**DEV — Backend (ms-events)**
- [ ] Crear migración `V6__add_event_metadata_fields.sql` con columnas: `image_url VARCHAR(500)`, `subtitle VARCHAR(300)`, `location VARCHAR(300)`, `director VARCHAR(200)`, `cast_members VARCHAR(500)`, `duration INTEGER`, `tag VARCHAR(100)`, `is_limited BOOLEAN DEFAULT FALSE`, `is_featured BOOLEAN DEFAULT FALSE`, `author VARCHAR(200)` — todas nullable excepto booleanos con default
- [ ] Agregar campos correspondientes en `Event.java` con `@Column(nullable = true)` (booleanos con `columnDefinition = "boolean default false"`)
- [ ] Actualizar `EventCreateRequest.java` para aceptar campos opcionales (sin `@NotNull`): `imageUrl`, `subtitle`, `location`, `director`, `castMembers`, `duration`, `tag`, `isLimited`, `isFeatured`, `author`
- [ ] Actualizar `EventDetailResponse.java` para exponer: `imageUrl`, `subtitle`, `location`, `director`, `castMembers`, `duration`, `tag`, `isLimited`, `isFeatured`, `author`
- [ ] Actualizar `convertToEventDetailResponse()` en `EventService.java` para mapear los nuevos campos
- [ ] Agregar `@Min(1)` en el campo `duration` del request (solo si no es null)

**DEV — Frontend**
- [ ] Agregar campos faltantes en `EventResponse` (event.types.ts): `subtitle?: string`, `location?: string`, `isFeatured?: boolean`
- [ ] Asegurar que `cast` en el tipo frontend coincide con el campo del backend (renombrar si el backend usa `castMembers`)
- [ ] Actualizar componentes de cartelera (`EventCard`, `EventHero`) para mostrar `subtitle`, `location`, badge `isFeatured`

**QA**
- [ ] Verificar creación de evento con todos los campos de metadata (incluye subtitle, location, isFeatured)
- [ ] Verificar creación de evento sin ningún campo de metadata (todos null, booleanos false)
- [ ] Verificar que GET /api/v1/events incluye imageUrl, subtitle, location, tag, isLimited e isFeatured
- [ ] Verificar que GET /api/v1/events/:id incluye todos los campos de metadata
- [ ] Verificar validación de duration negativo
- [ ] Verificar que el frontend renderiza hero, subtítulo, ubicación, badges y tarjetas Director/Elenco con los datos reales

---

### HU-INT-02: Paginación en el listado de eventos publicados — SP: 3

Como **Comprador**
Quiero que la cartelera cargue eventos de forma progresiva (paginada)
Para no esperar la carga de todo el catálogo y tener una experiencia de navegación fluida

**Microservicio:** `ms-events`
**Dependencia:** HU-03 (GET /api/v1/events existente)
**Justificación SP:** Requiere introducir `Pageable` de Spring Data en el repository y service, modificar el controller para aceptar query params y devolver la estructura paginada con `page`, `pageSize`, `hasMore`. Baja-media complejidad.

#### Criterios de Aceptación

**CA-01. Paginación con parámetros page y pageSize**
```gherkin
Escenario: Listado paginado de eventos
  Dado que existen 25 eventos publicados en el sistema
  Cuando el comprador solicita GET /api/v1/events?page=1&pageSize=10
  Entonces la respuesta contiene los primeros 10 eventos
  Y incluye los campos: total=25, page=1, pageSize=10, hasMore=true
```

**CA-02. Última página sin más resultados**
```gherkin
Escenario: Última página del listado
  Dado que existen 25 eventos publicados
  Cuando el comprador solicita GET /api/v1/events?page=3&pageSize=10
  Entonces la respuesta contiene 5 eventos
  Y incluye hasMore=false
```

**CA-03. Valores por defecto cuando no se envían parámetros**
```gherkin
Escenario: Paginación con valores por defecto
  Dado que el comprador solicita GET /api/v1/events sin query params
  Cuando el backend procesa la petición
  Entonces usa page=1 y pageSize=10 por defecto
  Y la respuesta incluye los campos de paginación completos
```

**CA-04. Orden consistente por fecha de creación descendente**
```gherkin
Escenario: Eventos ordenados por fecha de creación
  Dado que existen múltiples eventos publicados
  Cuando el comprador solicita cualquier página del listado
  Entonces los eventos vienen ordenados por created_at descendente (más recientes primero)
```

#### Subtasks

**DEV — Backend (ms-events)**
- [ ] Modificar `EventController.getPublishedEvents()` para aceptar `@RequestParam(defaultValue = "1") int page` y `@RequestParam(defaultValue = "10") int pageSize`
- [ ] Modificar `EventService.getPublishedEvents()` para recibir `page` y `pageSize`, usar `PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))`
- [ ] Actualizar `EventRepository` con método `findByStatus(EventStatus status, Pageable pageable)` que retorne `Page<Event>`
- [ ] Actualizar la respuesta del controller para incluir `total`, `page`, `pageSize` y `hasMore` calculado como `page < totalPages`

**DEV — Frontend**
- [ ] Verificar que `useEvents.ts` ya envía `page` y `pageSize` como query params (confirmado: sí)
- [ ] Verificar que el parseo de `hasMore` funciona correctamente con la nueva respuesta

**QA**
- [ ] Verificar paginación con page=1, pageSize=10 y más de 10 eventos
- [ ] Verificar última página con hasMore=false
- [ ] Verificar valores por defecto cuando no se envían params
- [ ] Verificar orden descendente por created_at
- [ ] Verificar integración frontend: botón "Load More" visible con hasMore=true y oculto con hasMore=false

---

### HU-INT-03: Corrección de contratos y configuración de desarrollo — SP: 2

Como **Desarrollador**
Quiero que los tipos TypeScript del frontend coincidan exactamente con los DTOs del backend y que el entorno de desarrollo local funcione sin configuración manual
Para evitar errores silenciosos de tipo y permitir onboarding inmediato

**Capas:** `frontend/`, `ms-events/`
**Dependencia:** Ninguna
**Justificación SP:** Cambios puntuales en tipos, configuración de proxy y archivo de entorno. Baja complejidad pero alto impacto preventivo.

#### Criterios de Aceptación

**CA-01. TierResponse.price como number en el frontend**
```gherkin
Escenario: Precio del tier recibido como número
  Dado que el backend envía price como BigDecimal (serializado como número JSON)
  Cuando el frontend deserializa la respuesta
  Entonces el campo price tiene tipo number
  Y no es necesario usar parseFloat() para operaciones aritméticas
```

**CA-02. Proxy de desarrollo configurado en Vite**
```gherkin
Escenario: Peticiones API funcionan en desarrollo local
  Dado que el desarrollador ejecuta el frontend con npm run dev
  Cuando el frontend hace una petición a /api/v1/events
  Entonces Vite redirige la petición al api-gateway en localhost:8080
  Y no se requiere configurar VITE_API_URL manualmente
```

**CA-03. Archivo .env.example documenta la variable VITE_API_URL**
```gherkin
Escenario: Variable de entorno documentada
  Dado que un nuevo desarrollador clona el repositorio
  Cuando revisa el directorio frontend/
  Entonces existe un archivo .env.example con VITE_API_URL=http://localhost:8080
  Y el README menciona copiarlo a .env.local
```

**CA-04. RoomResponse completo en el frontend**
```gherkin
Escenario: Tipo RoomResponse incluye timestamps
  Dado que el backend envía createdAt y updatedAt en RoomResponse
  Cuando el frontend recibe la respuesta
  Entonces los campos opcionales createdAt y updatedAt están disponibles en el tipo
```

#### Subtasks

**DEV — Frontend**
- [ ] Cambiar `price: string` a `price: number` en `TierResponse` (event.types.ts)
- [ ] Eliminar todos los `parseFloat(tier.price)` en el codebase (EventDetail.tsx, CheckoutScreen.tsx, etc.)
- [ ] Agregar `createdAt?: string` y `updatedAt?: string` a `RoomResponse`
- [ ] Agregar proxy en `vite.config.ts`: `server: { proxy: { '/api': 'http://localhost:8080' } }`
- [ ] Crear `frontend/.env.example` con `VITE_API_URL=http://localhost:8080`
- [ ] Actualizar eventService.ts para usar URL relativa `/api/v1/events` cuando `VITE_API_URL` no está definida (fallback al proxy)

**QA**
- [ ] Verificar que `price` se opera como number sin coerción en el checkout
- [ ] Verificar que el frontend arranca con `npm run dev` sin `.env.local` (proxy activo)
- [ ] Verificar que el frontend arranca con `.env.local` configurado (variable directa)
- [ ] Verificar que `.env.example` existe y tiene el contenido correcto

---

### HU-INT-04: Seed data de demo y README de arranque — SP: 3

Como **Desarrollador / Evaluador de demo**
Quiero que al levantar el sistema por primera vez existan 4 eventos de ejemplo con imagen, metadata artística, tiers configurados y estado PUBLISHED
Para poder ver una cartelera funcional y atractiva inmediatamente sin necesidad de crear datos manualmente

**Capas:** `ms-events/` (migración seed), raíz del proyecto (README)
**Dependencia:** HU-INT-01 (campos de metadata), HU-INT-02 (paginación)
**Justificación SP:** Requiere un script SQL con inserts encadenados (rooms → events → tiers) que cubra los 4 eventos mock con datos realistas, además de documentar el proceso completo de arranque del sistema en el README. Baja-media complejidad pero alto valor de demo.

#### Datos de los 4 eventos demo

```
Evento 1: BODAS DE SANGRE
  subtitle:    Federico García Lorca
  date:        (fecha futura dinámica, ej. NOW + 30 días)
  location:    TEATRO REAL, MADRID
  room:        Teatro Real (maxCapacity: 300)
  capacity:    200
  duration:    120
  price base:  $75
  image:       https://picsum.photos/seed/theater/1200/800
  description: Una tragedia en verso y prosa donde el deseo choca contra las leyes
               no escritas del honor y la tierra. En esta nueva visión de Teatro Noir,
               la obra de Lorca se transforma en un thriller visual de sombras
               prolongadas y pasiones eléctricas.
  director:    Alejandro G. Iñárritu
  cast:        Penélope Cruz, Javier Bardem
  isFeatured:  true
  isLimited:   false
  tag:         FEATURED PERFORMANCE
  Tiers:       GENERAL ($75, cupo 150), VIP ($120, cupo 50)

Evento 2: The Phantom's Echo
  subtitle:    A Noir Opera Experience
  date:        (fecha futura dinámica, ej. NOW + 45 días)
  location:    GRAND OPERA HOUSE
  room:        Grand Opera House (maxCapacity: 500)
  capacity:    400
  duration:    150
  price base:  $120
  image:       https://picsum.photos/seed/opera/1200/800
  description: A dramatic wide shot of a stage performance with a lone cellist
               in a spotlight and deep shadows in a grand theater.
  director:    Christopher Nolan
  cast:        Cillian Murphy
  isFeatured:  true
  isLimited:   false
  tag:         FEATURED PERFORMANCE
  Tiers:       GENERAL ($120, cupo 300), VIP ($200, cupo 80), EARLY_BIRD ($95, cupo 20, vigencia NOW → NOW+15d)

Evento 3: Midnight Jazz Ritual
  subtitle:    An Intimate Jazz Session
  date:        (fecha futura dinámica, ej. NOW + 60 días)
  location:    THE VELVET LOUNGE
  room:        The Velvet Lounge (maxCapacity: 100)
  capacity:    80
  duration:    90
  price base:  $45
  image:       https://picsum.photos/seed/jazz/1200/800
  description: Dark moody atmosphere of a jazz club with golden lighting
               highlighting brass instruments and soft smoke swirls.
  director:    Damien Chazelle
  cast:        Ryan Gosling
  isFeatured:  false
  isLimited:   false
  Tiers:       GENERAL ($45, cupo 60), VIP ($85, cupo 20)

Evento 4: Kinetic Shadows
  subtitle:    Contemporary Dance Exhibition
  date:        (fecha futura dinámica, ej. NOW + 20 días)
  location:    ARTS CENTER
  room:        Arts Center (maxCapacity: 150)
  capacity:    120
  duration:    75
  price base:  $35
  image:       https://picsum.photos/seed/dance/1200/800
  description: Minimalist modern dance composition with high contrast lighting
               on a dark stage showing two silhouettes in motion.
  director:    Sidi Larbi Cherkaoui
  cast:        Modern Dance Ensemble
  isFeatured:  false
  isLimited:   true
  tag:         LIMITED SEATING
  Tiers:       GENERAL ($35, cupo 100), VIP ($65, cupo 20)
```

#### Criterios de Aceptación

**CA-01. Migración seed carga los 4 eventos al arrancar**
```gherkin
Escenario: Datos de demo disponibles tras levantar el sistema
  Dado que la base de datos de ms-events está vacía
  Cuando Flyway ejecuta las migraciones al arrancar el servicio
  Entonces existen 4 rooms con names: "Teatro Real", "Grand Opera House", "The Velvet Lounge", "Arts Center"
  Y existen 4 eventos con status PUBLISHED y metadata completa (imageUrl, subtitle, location, director, cast, duration, tag)
  Y cada evento tiene al menos 2 tiers configurados con precios y cupos
  Y los eventos con isFeatured=true son "BODAS DE SANGRE" y "The Phantom's Echo"
  Y el evento "Kinetic Shadows" tiene isLimited=true
```

**CA-02. Fechas de eventos son futuras relativas al momento de ejecución**
```gherkin
Escenario: Fechas de demo siempre vigentes
  Dado que la migración seed se ejecuta en cualquier fecha
  Cuando inserta los eventos demo
  Entonces las fechas de evento son calculadas como NOW() + intervalo (30, 45, 60, 20 días)
  Y los eventos siempre aparecen como futuros en la cartelera
```

**CA-03. Cartelera pública funcional tras solo docker-compose up**
```gherkin
Escenario: Demo funcional sin pasos manuales
  Dado que el evaluador clona el repositorio
  Cuando ejecuta docker-compose up (o el script de arranque documentado)
  Entonces la base de datos se crea y se puebla automáticamente con los datos seed
  Y la cartelera en /eventos muestra los 4 eventos con imágenes, badges y precios
  Y el detalle de cualquier evento muestra director, elenco, duración y tiers disponibles
```

**CA-04. README documenta el flujo completo de arranque**
```gherkin
Escenario: README con instrucciones de arranque
  Dado que un evaluador lee el README.md de la raíz del proyecto
  Cuando busca instrucciones de arranque
  Entonces encuentra una sección "Quick Start" con:
    - Prerrequisitos (Docker, Node.js)
    - Comando para levantar backend + DB (docker-compose up)
    - Comando para levantar frontend (npm run dev)
    - URL de la cartelera (http://localhost:5173/eventos)
    - URL del panel admin (http://localhost:5173/admin/login)
    - Credenciales de demo admin
    - Nota sobre las imágenes placeholder de picsum.photos
```

**CA-05. Idempotencia del seed**
```gherkin
Escenario: Seed no duplica datos en reinicios
  Dado que el sistema ya fue arrancado y los datos seed existen
  Cuando el servicio se reinicia y Flyway ejecuta migraciones
  Entonces la migración seed no se ejecuta otra vez (es una Flyway versioned migration, V7)
  Y los datos de demo permanecen intactos
```

#### Subtasks

**DEV — Backend (ms-events)**
- [ ] Crear migración `V7__seed_demo_data.sql` con:
  - INSERT de 4 rooms: Teatro Real (300), Grand Opera House (500), The Velvet Lounge (100), Arts Center (150)
  - INSERT de 4 events con todos los campos de metadata (imageUrl, subtitle, location, director, cast_members, duration, tag, is_limited, is_featured, author) y status=PUBLISHED
  - INSERT de tiers por evento (2-3 tiers cada uno con precios y cupos según la tabla anterior)
  - Fechas calculadas con `NOW() + INTERVAL 'X days'` para que siempre sean futuras
  - UUIDs determinísticos generados con `gen_random_uuid()` o hardcodeados para reproducibilidad
- [ ] Verificar que el seed es compatible con las constraints existentes (FK rooms → events, FK events → tiers)
- [ ] Verificar que la migración V7 corre después de V6 (metadata fields deben existir)

**DEV — Documentación**
- [ ] Actualizar `README.md` de la raíz con sección **Quick Start** que incluya:
  - Prerrequisitos: Docker + Docker Compose, Node.js 18+
  - `docker-compose up -d` para levantar PostgreSQL, RabbitMQ, ms-events, ms-ticketing, ms-notifications, api-gateway
  - `cd frontend && npm install && npm run dev` para levantar el frontend
  - URLs de acceso: cartelera (`/eventos`), panel admin (`/admin/login`)
  - Credenciales admin demo: admin@sem7.com / admin123
  - Descripción de los 4 eventos de demo cargados
  - Nota: las imágenes usan picsum.photos (requiere conexión a internet)
- [ ] Agregar sección **Datos de Demo** explicando que V7 carga 4 eventos, 4 rooms y sus tiers automáticamente
- [ ] Agregar sección **Arquitectura** con diagrama ASCII de los servicios y sus puertos

**QA**
- [ ] Verificar que `docker-compose up` + `npm run dev` resulta en una cartelera funcional con 4 eventos
- [ ] Verificar que los 4 eventos muestran imágenes desde picsum.photos
- [ ] Verificar que los badges (isFeatured, isLimited) aparecen correctamente
- [ ] Verificar que el detalle de cada evento muestra director, elenco, duración
- [ ] Verificar que cada evento tiene tiers con precios visibles
- [ ] Verificar que al reiniciar servicios los datos seed no se duplican
- [ ] Verificar que el README tiene instrucciones claras y funcionales

---

## Parte B — Panel de Administración Frontend

### HU-ADM-01: Login de administrador y protección de rutas — SP: 3

Como **Administrador**
Quiero ingresar al panel de administración con mis credenciales
Para acceder a las funcionalidades de gestión de eventos de forma segura

**Capa:** `frontend/`
**Dependencia:** Ninguna (auth simulada con X-Role header en esta iteración)
**Justificación SP:** Requiere una página de login, contexto de autenticación (React Context), guard de rutas protegidas y persistencia de sesión en localStorage. Auth real diferida — en esta iteración se simula con `X-Role: ADMIN` y `X-User-Id`.

#### Criterios de Aceptación

**CA-01. Login simulado con credenciales de prueba**
```gherkin
Escenario: Administrador accede al panel
  Dado que el administrador está en la página /admin/login
  Cuando ingresa las credenciales de prueba (email: admin@sem7.com, password: admin123)
  Entonces el sistema establece la sesión con role=ADMIN y userId=UUID de demo
  Y redirige al dashboard de administración /admin/events
  Y la sesión se persiste en localStorage
```

**CA-02. Credenciales inválidas rechazadas**
```gherkin
Escenario: Login con credenciales incorrectas
  Dado que el administrador está en la página /admin/login
  Cuando ingresa credenciales que no coinciden con las de prueba
  Entonces se muestra un mensaje de error "Credenciales inválidas"
  Y no se redirige al dashboard
```

**CA-03. Rutas /admin/* protegidas**
```gherkin
Escenario: Acceso directo a ruta protegida sin sesión
  Dado que no existe sesión activa de administrador
  Cuando un usuario intenta acceder a /admin/events directamente
  Entonces el sistema redirige a /admin/login
```

**CA-04. Cierre de sesión**
```gherkin
Escenario: Admin cierra sesión
  Dado que el administrador tiene sesión activa
  Cuando hace clic en "Cerrar Sesión" en el navbar del panel
  Entonces la sesión se elimina de localStorage
  Y se redirige a /admin/login
```

**CA-05. Navbar del panel con identidad de admin**
```gherkin
Escenario: Navbar del panel de administración
  Dado que el administrador está en cualquier ruta /admin/*
  Cuando el navbar se renderiza
  Entonces muestra el logo SEM7 + sufijo "Admin"
  Y muestra el nombre/email del administrador
  Y muestra un botón "Cerrar Sesión"
  Y el fondo del navbar es un color distintivo (ej. surface-highest)
```

#### Subtasks

**DEV**
- [ ] Crear `contexts/AuthContext.tsx` con `AuthProvider`, `useAuth()`, estado: `{ role, userId, email, isAuthenticated }`
- [ ] Persistir sesión en `localStorage` (JSON serializado, key: `sem7_admin_session`)
- [ ] Crear página `pages/admin/LoginPage.tsx` con form email + password
- [ ] Implementar validación contra credenciales de demo hardcodeadas (admin@sem7.com / admin123)
- [ ] Crear componente `components/admin/AdminGuard.tsx` que redirect a /admin/login si !isAuthenticated
- [ ] Crear componente `components/admin/AdminNavBar.tsx` con logo, nombre de admin y botón logout
- [ ] Registrar rutas en `App.tsx`: `/admin/login` (público), `/admin/*` (protegido con AdminGuard)
- [ ] Documentar credenciales de prueba en README

**QA**
- [ ] Verificar login exitoso con credenciales de demo
- [ ] Verificar rechazo con credenciales inválidas
- [ ] Verificar redirección a /admin/login sin sesión
- [ ] Verificar persistencia de sesión al recargar la página
- [ ] Verificar cierre de sesión elimina datos de localStorage
- [ ] Verificar que las rutas de comprador (/eventos) siguen funcionando sin sesión de admin

---

### HU-ADM-02: Dashboard de eventos — Listado y gestión — SP: 3

Como **Administrador**
Quiero ver un listado de todos los eventos del sistema con su estado actual
Para gestionar el catálogo, identificar borradores pendientes de publicar y monitorear eventos activos

**Capa:** `frontend/`
**Dependencia:** HU-ADM-01 (auth), HU-01/HU-03 (endpoints backend)
**Justificación SP:** Requiere tabla con ordenamiento, filtro por estado, badges y acciones contextuales. Media complejidad por la cantidad de estados y acciones.

#### Criterios de Aceptación

**CA-01. Tabla de eventos con columnas principales**
```gherkin
Escenario: Listado de eventos en el dashboard
  Dado que el administrador está en /admin/events
  Cuando la vista carga
  Entonces se muestra una tabla con columnas: Título, Fecha, Sala, Estado, Aforo, Tiers, Acciones
  Y cada fila muestra un evento del sistema (todos los estados: DRAFT, PUBLISHED, CANCELLED)
  Y el estado se muestra como badge visual (ej. DRAFT=amarillo, PUBLISHED=verde, CANCELLED=rojo)
```

**CA-02. Filtro por estado del evento**
```gherkin
Escenario: Filtrar eventos por estado
  Dado que el administrador está en el dashboard
  Cuando selecciona un filtro de estado (Todos, Borrador, Publicado, Cancelado)
  Entonces la tabla muestra solo los eventos que coinciden con el estado seleccionado
```

**CA-03. Indicador de tiers configurados**
```gherkin
Escenario: Columna de tiers configurados
  Dado que un evento tiene tiers configurados
  Cuando se renderiza la fila del evento
  Entonces la columna Tiers muestra el número de tiers configurados (ej. "3 tiers")
  Y si no tiene tiers muestra "Sin tiers" en color de advertencia
```

**CA-04. Acción de publicar evento desde la tabla**
```gherkin
Escenario: Publicar evento en estado DRAFT con tiers configurados
  Dado que un evento está en estado DRAFT y tiene al menos un tier configurado
  Cuando el administrador hace clic en "Publicar" en la fila del evento
  Entonces el sistema llama a PATCH /api/v1/events/:id/publish con header X-Role: ADMIN
  Y el estado del evento cambia a PUBLISHED
  Y el badge se actualiza en la tabla sin recargar la página
```

**CA-05. Acción de publicar bloqueada sin tiers**
```gherkin
Escenario: Botón publicar deshabilitado sin tiers
  Dado que un evento está en estado DRAFT sin tiers configurados
  Cuando se renderiza la fila del evento
  Entonces el botón "Publicar" está deshabilitado
  Y se muestra un tooltip: "Configura al menos un tier antes de publicar"
```

**CA-06. Navegación a la creación de evento**
```gherkin
Escenario: Botón crear evento
  Dado que el administrador está en /admin/events
  Cuando hace clic en el botón "Crear Evento"
  Entonces navega a /admin/events/new
```

**CA-07. Navegación al detalle/edición del evento**
```gherkin
Escenario: Clic en fila de evento abre el detalle
  Dado que el administrador ve un evento en la tabla
  Cuando hace clic en el título o en "Ver detalle"
  Entonces navega a /admin/events/:id donde puede ver los detalles y gestionar tiers
```

#### Subtasks

**DEV**
- [ ] Crear servicio `services/adminEventService.ts` con funciones: `getAllEvents()`, `publishEvent(eventId)` usando headers `X-Role: ADMIN`, `X-User-Id`
- [ ] Crear endpoint en backend o reutilizar uno existente que devuelva TODOS los eventos (no solo PUBLISHED) — requiere endpoint con `X-Role: ADMIN`
- [ ] Crear página `pages/admin/EventsDashboard.tsx` con tabla, filtros y acciones
- [ ] Crear componente `components/admin/EventStatusBadge.tsx` con variantes por estado
- [ ] Implementar filtro por estado (client-side)
- [ ] Implementar acción "Publicar" con llamada a `PATCH /api/v1/events/:id/publish`
- [ ] Agregar botón "Crear Evento" que navega a /admin/events/new
- [ ] Registrar rutas: `/admin/events`, `/admin/events/new`, `/admin/events/:id`

**QA**
- [ ] Verificar tabla carga todos los eventos (DRAFT + PUBLISHED + CANCELLED)
- [ ] Verificar filtro por estado funciona correctamente
- [ ] Verificar badges visuales por estado
- [ ] Verificar publicación exitosa desde la tabla
- [ ] Verificar botón publicar deshabilitado sin tiers
- [ ] Verificar navegación a creación y detalle
- [ ] Verificar headers X-Role y X-User-Id en todas las peticiones admin

---

### HU-ADM-03: Crear evento con metadata artística — SP: 5

Como **Administrador**
Quiero crear un nuevo evento ingresando toda la información base, el aforo y la metadata artística
Para prepararlo para su configuración comercial y posterior publicación con información visual completa

**Capa:** `frontend/`
**Dependencia:** HU-ADM-01 (auth), HU-ADM-02 (listado), HU-INT-01 (metadata backend)
**Justificación SP:** Formulario con > 10 campos, validaciones en tiempo real, integración con endpoint de creación, subida de URL de imagen, selección de sala y manejo de errores. Complejidad media-alta.

#### Criterios de Aceptación

**CA-01. Formulario de creación con campos obligatorios y opcionales**
```gherkin
Escenario: Formulario de creación de evento completo
  Dado que el administrador está en /admin/events/new
  Cuando la vista carga
  Entonces se muestra un formulario con:
    - Campos obligatorios: Título, Descripción, Fecha/Hora, Aforo, Sala (selector)
    - Campos opcionales: Subtítulo (ej. autor de la obra), URL de Imagen, Director, Elenco, Duración (min), Ubicación (ej. "TEATRO REAL, MADRID"), Etiqueta (tag), Aforo Limitado (toggle), Evento Destacado (toggle), Autor
  Y los campos obligatorios están marcados con asterisco (*)
```

**CA-02. Selector de sala con validación de aforo**
```gherkin
Escenario: Selección de sala y validación de aforo
  Dado que el administrador está completando el formulario
  Cuando selecciona una sala del dropdown
  Entonces se muestra el aforo máximo de la sala como referencia
  Y si el aforo ingresado excede el máximo de la sala el campo muestra error inline
  Y el botón "Crear Evento" se deshabilita
```

**CA-03. Validación de fecha futura**
```gherkin
Escenario: Fecha del evento debe ser futura
  Dado que el administrador ingresa una fecha para el evento
  Cuando la fecha es anterior o igual al momento actual
  Entonces el campo muestra un error inline: "La fecha debe ser posterior a la fecha actual"
  Y el botón "Crear Evento" se deshabilita
```

**CA-04. Creación exitosa y redirección**
```gherkin
Escenario: Evento creado exitosamente
  Dado que el administrador completó todos los campos obligatorios con datos válidos
  Cuando hace clic en "Crear Evento"
  Entonces se llama a POST /api/v1/events con los datos y headers X-Role + X-User-Id
  Y si la respuesta es 201 se muestra una notificación de éxito
  Y se redirige al detalle del evento recién creado (/admin/events/:id)
```

**CA-05. Manejo de errores del backend**
```gherkin
Escenario: Error de duplicado o sala no encontrada
  Dado que el administrador envía datos que causan un error en el backend
  Cuando la respuesta es 409 (evento duplicado) o 404 (sala no encontrada) o 400 (validación)
  Entonces se muestra un mensaje de error descriptivo en el formulario
  Y el administrador puede corregir y reenviar
```

**CA-06. Preview de imagen**
```gherkin
Escenario: Vista previa de imagen por URL
  Dado que el administrador ingresa una URL válida en el campo Imagen
  Cuando el campo pierde foco (onBlur)
  Entonces se muestra una miniatura de preview de la imagen
  Y si la URL no carga imagen se muestra un placeholder con icono de imagen rota
```

#### Subtasks

**DEV — Backend (ms-events)**
- [ ] Crear endpoint `GET /api/v1/rooms` (si no existe) para poblar el selector de salas — acceso con `X-Role: ADMIN`
- [ ] Verificar que `POST /api/v1/events` ya acepta los campos de metadata (tras HU-INT-01)

**DEV — Frontend**
- [ ] Crear página `pages/admin/CreateEventPage.tsx` con formulario completo
- [ ] Crear componente `components/admin/EventForm.tsx` reutilizable (crear y editar)
- [ ] Implementar campo Subtítulo (texto libre, placeholder: "ej. Federico García Lorca")
- [ ] Implementar campo Ubicación (texto libre, placeholder: "ej. TEATRO REAL, MADRID")
- [ ] Implementar selector de sala con `GET /api/v1/rooms` y display de aforo máximo
- [ ] Implementar validación client-side: campos requeridos, fecha futura, aforo <= maxCapacity, duration > 0
- [ ] Implementar preview de imagen por URL con fallback
- [ ] Implementar toggle de isLimited (switch visual) y toggle de isFeatured (switch visual)
- [ ] Implementar select/input para tag con sugerencias (ej. "FEATURED PERFORMANCE", "LIMITED SEATING", texto libre)
- [ ] Llamar a `POST /api/v1/events` con headers auth
- [ ] Manejar errores 400, 404, 409 con mensajes descriptivos
- [ ] Redirigir a detalle del evento tras creación exitosa (toast + navigate)

**QA**
- [ ] Verificar que todos los campos obligatorios son requeridos
- [ ] Verificar validación de aforo contra sala seleccionada
- [ ] Verificar validación de fecha futura
- [ ] Verificar creación exitosa con metadata completa
- [ ] Verificar creación exitosa sin metadata (solo obligatorios)
- [ ] Verificar error 409 (evento duplicado) con mensaje descriptivo
- [ ] Verificar error 404 (sala no encontrada)
- [ ] Verificar preview de imagen con URL válida e inválida
- [ ] Verificar redirección correcta tras creación

---

### HU-ADM-04: Configuración de tiers y precios desde el panel — SP: 5

Como **Administrador**
Quiero configurar los tiers (VIP, General, Early Bird), sus cupos y precios desde el detalle del evento
Para definir la estructura comercial antes de publicar el evento

**Capa:** `frontend/`
**Dependencia:** HU-ADM-03 (evento creado), HU-02 (endpoint de tiers backend)
**Justificación SP:** Formulario multi-tier con validaciones cruzadas (suma de cupos vs aforo), vigencia temporal para Early Bird, CRUD de tiers y feedback visual. Complejidad media-alta.

#### Criterios de Aceptación

**CA-01. Vista de detalle del evento con gestión de tiers**
```gherkin
Escenario: Panel de gestión de tiers en detalle del evento
  Dado que el administrador está en /admin/events/:id
  Cuando la vista carga
  Entonces se muestra la información del evento (título, fecha, sala, aforo)
  Y debajo se muestra la sección "Configuración de Tiers"
  Y si no hay tiers configurados se muestra un mensaje "No hay tiers configurados aún"
  Y se muestra un botón "Agregar Tier"
```

**CA-02. Formulario para agregar un tier**
```gherkin
Escenario: Agregar nuevo tier al evento
  Dado que el administrador está en el detalle de un evento DRAFT
  Cuando hace clic en "Agregar Tier"
  Entonces aparece un formulario con: Tipo (VIP/GENERAL/EARLY_BIRD), Precio, Cupo
  Y si el tipo seleccionado es EARLY_BIRD aparecen campos adicionales: Fecha inicio y Fecha fin de vigencia
  Y al enviar el formulario se llama a POST /api/v1/events/:id/tiers
  Y si es exitoso el tier aparece en la lista sin recargar la página
```

**CA-03. Validación de suma de cupos vs aforo**
```gherkin
Escenario: Cupos no exceden el aforo del evento
  Dado que el evento tiene aforo = 200 y ya tiene tiers con cupos sumando 150
  Cuando el administrador intenta agregar un tier con cupo = 60
  Entonces el formulario muestra error: "La suma de cupos (210) excede el aforo del evento (200)"
  Y no se permite enviar el formulario
```

**CA-04. Vigencia temporal del Early Bird**
```gherkin
Escenario: Early Bird con ventana de vigencia
  Dado que el administrador agrega un tier EARLY_BIRD
  Cuando define fecha inicio y fecha fin de vigencia
  Entonces las fechas se envían como validFrom y validUntil al backend
  Y si la fecha inicio es posterior a la fecha fin se muestra error de validación
```

**CA-05. Validación de precio**
```gherkin
Escenario: Precio debe ser positivo
  Dado que el administrador ingresa un precio para un tier
  Cuando el precio es menor o igual a cero
  Entonces se muestra error inline: "El precio debe ser mayor a $0"
```

**CA-06. Lista de tiers configurados con acciones**
```gherkin
Escenario: Visualización de tiers existentes
  Dado que el evento tiene tiers configurados
  Cuando se renderiza la sección de tiers
  Entonces se muestran los tiers como tarjetas con: tipo (badge), precio, cupo, vigencia (si Early Bird)
  Y se muestra una barra de progreso: cupo total asignado vs aforo del evento
  Y cada tier tiene un botón "Eliminar" (solo si el evento es DRAFT)
```

**CA-07. Publicar evento desde el detalle**
```gherkin
Escenario: Publicar directamente desde la vista de detalle
  Dado que el evento está en DRAFT y tiene al menos un tier configurado
  Cuando el administrador hace clic en "Publicar Evento"
  Entonces se muestra un modal de confirmación: "¿Publicar este evento? Una vez publicado será visible para los compradores."
  Y al confirmar se llama a PATCH /api/v1/events/:id/publish
  Y el estado cambia a PUBLISHED y la interfaz se actualiza
```

#### Subtasks

**DEV — Backend (ms-events)**
- [ ] Verificar que `POST /api/v1/events/:id/tiers` existe y funciona (HU-02)
- [ ] Verificar que `DELETE /api/v1/events/:id/tiers/:tierId` existe (crear si no)
- [ ] Verificar que se retornan los tiers del evento en `GET /api/v1/events/:id`

**DEV — Frontend**
- [ ] Crear página `pages/admin/EventDetailAdmin.tsx` con info del evento + sección de tiers
- [ ] Crear componente `components/admin/TierForm.tsx` con campos tipo, precio, cupo, vigencia (condicional)
- [ ] Crear componente `components/admin/TierCard.tsx` para mostrar tier configurado
- [ ] Crear componente `components/admin/CapacityBar.tsx` barra de progreso cupo asignado / aforo
- [ ] Implementar validación de suma de cupos vs aforo (client-side en tiempo real)
- [ ] Implementar CRUD de tiers con `adminEventService.ts`
- [ ] Implementar botón "Publicar Evento" con modal de confirmación
- [ ] Deshabilitar edición de tiers cuando evento está PUBLISHED

**QA**
- [ ] Verificar carga del detalle del evento con tiers existentes
- [ ] Verificar agregar tier VIP con precio y cupo válidos
- [ ] Verificar agregar tier EARLY_BIRD con vigencia temporal
- [ ] Verificar rechazo por suma de cupos > aforo
- [ ] Verificar rechazo por precio no positivo
- [ ] Verificar barra de progreso de cupos
- [ ] Verificar publicación exitosa desde detalle
- [ ] Verificar que no se pueden editar tiers de evento publicado
- [ ] Verificar eliminación de tier en evento DRAFT

---

### HU-ADM-05: Flujo completo admin — de creación a publicación — SP: 2

Como **Administrador**
Quiero poder completar todo el ciclo de vida de un evento (crear → configurar tiers → publicar) sin salir del panel
Para gestionar eficientemente el catálogo de obras de teatro

**Capa:** `frontend/`
**Dependencia:** HU-ADM-01, HU-ADM-02, HU-ADM-03, HU-ADM-04
**Justificación SP:** Historia de integración. No crea componentes nuevos pero asegura que la navegación, los estados y las transiciones del flujo admin sean coherentes. Baja complejidad.

#### Criterios de Aceptación

**CA-01. Flujo completo sin interrupciones**
```gherkin
Escenario: Admin crea evento, configura tiers y publica
  Dado que el administrador está autenticado en /admin/events
  Cuando hace clic en "Crear Evento"
  Y completa el formulario con datos válidos y envía
  Entonces es redirigido al detalle del evento (/admin/events/:id)
  Cuando agrega tiers con precios y cupos válidos
  Y hace clic en "Publicar Evento" y confirma
  Entonces el evento aparece como PUBLISHED en el dashboard
  Y el evento es visible en la cartelera pública (/eventos)
```

**CA-02. Breadcrumbs de navegación**
```gherkin
Escenario: Navegación con breadcrumbs en el panel admin
  Dado que el administrador navega por el panel
  Cuando está en cualquier sub-ruta de /admin/
  Entonces se muestran breadcrumbs: Admin > Eventos > [Crear / nombre del evento]
  Y cada segmento es clicable para navegar
```

**CA-03. Estado vacío útil en el dashboard**
```gherkin
Escenario: Dashboard sin eventos
  Dado que no existen eventos en el sistema
  Cuando el administrador accede al dashboard
  Entonces se muestra un estado vacío con ilustración e indicación:
    "No hay eventos aún. ¡Crea tu primer evento para comenzar!"
  Y se muestra un botón "Crear Primer Evento" que navega al formulario
```

**CA-04. Separación visual entre panel admin y tienda pública**
```gherkin
Escenario: Identidad visual del panel de administración
  Dado que el administrador navega por /admin/*
  Cuando las páginas se renderizan
  Entonces el layout usa un sidebar o navbar superior distinto al de la tienda pública
  Y no se muestra el BottomNav de la tienda
  Y el color de acento o fondo del navbar distingue claramente el contexto admin
```

#### Subtasks

**DEV**
- [ ] Crear componente `components/admin/Breadcrumbs.tsx` basado en la ruta actual
- [ ] Agregar layout wrapper `AdminLayout.tsx` que incluya AdminNavBar + Breadcrumbs + Outlet (React Router)
- [ ] Implementar estado vacío en EventsDashboard
- [ ] Verificar flujo completo: login → dashboard → crear → detalle + tiers → publicar → visible en /eventos
- [ ] Verificar que BottomNav NO se muestra en rutas /admin/*

**QA**
- [ ] Ejecutar flujo completo de creación a publicación
- [ ] Verificar que el evento publicado aparece en la cartelera pública
- [ ] Verificar breadcrumbs navegables en todas las sub-rutas admin
- [ ] Verificar estado vacío cuando no hay eventos
- [ ] Verificar separación visual entre admin y tienda

---

## Resumen de Historias

### Parte A — Correcciones de Integración

| HU | Título | SP | Capa | Dependencias |
|----|--------|----|------|-------------|
| HU-INT-01 | Extensión modelo Event con metadata artística | 5 | Backend (ms-events) | HU-01 |
| HU-INT-02 | Paginación en GET /api/v1/events | 3 | Backend (ms-events) | HU-03 |
| HU-INT-03 | Corrección de contratos y config de desarrollo | 2 | Frontend | Ninguna |
| HU-INT-04 | Seed data de demo y README de arranque | 3 | Backend + Docs | HU-INT-01, HU-INT-02 |

**Subtotal Parte A:** 13 SP

### Parte B — Panel de Administración

| HU | Título | SP | Capa | Dependencias |
|----|--------|----|------|-------------|
| HU-ADM-01 | Login admin y protección de rutas | 3 | Frontend | Ninguna |
| HU-ADM-02 | Dashboard de eventos — listado y gestión | 3 | Frontend | HU-ADM-01, HU-01/03 |
| HU-ADM-03 | Crear evento con metadata artística | 5 | Frontend + Backend | HU-ADM-01/02, HU-INT-01 |
| HU-ADM-04 | Configuración de tiers y precios | 5 | Frontend + Backend | HU-ADM-03, HU-02 |
| HU-ADM-05 | Flujo completo admin — creación a publicación | 2 | Frontend | HU-ADM-01/02/03/04 |

**Subtotal Parte B:** 18 SP

### Total: 31 SP

---

## Orden de desarrollo sugerido

```
[Fase 1 — Backend]  HU-INT-01 + HU-INT-02  (paralelo, ms-events)
[Fase 2 — Backend]  HU-INT-04              (seed data, requiere V6 de Fase 1)
[Fase 3 — Frontend] HU-INT-03              (independiente, puede ir en paralelo con Fase 2)
[Fase 4 — Frontend] HU-ADM-01              (auth context)
[Fase 5 — Frontend] HU-ADM-02 + HU-ADM-03 (paralelo, dashboard + form)
[Fase 6 — Frontend] HU-ADM-04              (requiere form creado)
[Fase 7 — Frontend] HU-ADM-05              (integración + polish)
```

---

## Notas de dominio

- Usar terminología canónica: `event`, `capacity`, `tier`, `reservation`, `ticket`, `mock payment`, `expiration`, `notification`
- Timestamps siempre en UTC: `created_at`, `updated_at`
- Headers de autenticación simulada: `X-Role: ADMIN`, `X-User-Id: <uuid>` en todas las peticiones admin
- El campo `cast` del dominio se almacena como `cast_members` en la base de datos para evitar conflicto con la palabra reservada SQL `CAST`. En JSON se serializa como string separado por comas; el frontend hace split para renderizar la lista
- Los 4 eventos mock de referencia se cargan automáticamente vía migración Flyway V7 — no requiere intervención manual
- Las imágenes de demo usan `picsum.photos/seed/<keyword>` — requiere conexión a internet
- `subtitle` es un campo genérico: puede contener el nombre del autor de la obra, un tagline o una fecha formateada según decida el admin
- `location` es texto libre y NO se deriva del Room; un Room puede no tener ciudad asociada, pero `location` muestra "TEATRO REAL, MADRID" como texto de presentación
- `isFeatured` controla si el evento se destaca visualmente en la cartelera (hero card, badge especial); `isLimited` indica cupos reducidos
- Flujo admin: Login → Dashboard → Crear Evento → Configurar Tiers → Publicar → Visible en cartelera pública
- El panel admin tiene identidad visual propia (layout, navbar, breadcrumbs) separada de la tienda pública
