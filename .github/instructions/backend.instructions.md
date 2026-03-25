---
applyTo: "ms-*/src/main/java/**/*.java"
---

> **Scope**: Se aplica a proyectos backend Java 17+ con Spring Boot 3.x bajo arquitectura de microservicios.

# Instrucciones para Archivos de Backend (Java/Spring Boot)

## Restricciones y Convenciones Obligatorias

- **Tecnologia obligatoria**: Spring Boot, Spring Data JPA, Hibernate, PostgreSQL, Lombok, Jakarta Validation.
- **Arquitectura obligatoria**: estructura por capas `Controller -> Service -> Repository -> Entity -> DTO -> Exception`.
- **Dominio obligatorio para HU-01/HU-02**: incluir entidad `Room` (Sala) con `maxCapacity`, y entidad `Event` asociada a `Room`.
- **No desviaciones de stack**: no usar frameworks alternativos de persistencia o validacion fuera del stack definido por la spec.

## Arquitectura en Capas

Siempre sigue la arquitectura en capas del microservicio:

```
controllers -> services -> repositories -> PostgreSQL
```

- **`src/main/java/.../controller/`**: Parsear HTTP, validar entrada y delegar al service.
- **`src/main/java/.../service/`**: Lógica de negocio y orquestación transaccional.
- **`src/main/java/.../repository/`**: Único lugar con acceso a BD usando Spring Data JPA.
- **`src/main/java/.../model/`**: Entidades JPA (incluye `Room` y `Event` cuando aplique).
- **`src/main/java/.../dto/`**: Contratos de entrada/salida.
- **`src/main/java/.../exception/`**: Excepciones de dominio y handler global.

## Wiring de Dependencias (patrón obligatorio)

```java
// ✅ Correcto — constructor injection
@RestController
@RequestMapping("/api/v1/events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }
}
```

Usar constructor injection para controladores, servicios y repositorios.
Evitar estado global mutable y lógica de negocio en controladores.

## Convenciones de Código

- Java 17+ y Spring Boot 3.x.
- `camelCase` para métodos/variables y `PascalCase` para clases.
- Endpoints bajo prefijo `/api/v1/...`.
- Toda entidad persistida incluye `created_at` y `updated_at` en UTC.
- Persistencia con PostgreSQL por microservicio y repositorios JPA.
- Integración asíncrona entre servicios vía RabbitMQ cuando aplique.

## Nuevos Endpoints / Componentes

Para agregar un endpoint:
1. Crear o actualizar `Entity` y `DTO` segun la spec.
2. Implementar o ajustar `Repository` JPA.
3. Implementar o ajustar `Service` con reglas de negocio.
4. Crear o ajustar `Controller` para exponer endpoint HTTP.
5. Definir `Exception` de dominio y mapearlas en handler global.
6. Validar contrato request/response segun spec aprobada.

## Reglas de Dominio para Ticketing

- `Room.maxCapacity` define el limite superior permitido para `Event.capacity`.
- Ningun `Event` puede persistirse con `capacity > Room.maxCapacity`.
- El modelo `Event` debe mantener asociacion explicita a `Room` (por FK o relacion JPA equivalente).
- Mantener `created_at` y `updated_at` en UTC en todas las entidades persistidas.

> Ver `README.md` para estructura real por microservicio (`api-gateway`, `ms-events`, `ms-ticketing`, `ms-notifications`).

## Nunca hacer

- Acceso a BD desde controladores.
- Publicar credenciales o secretos en código.
- Acoplar un microservicio directamente a la BD de otro.

---

> Para estándares de Clean Code, SOLID, REST, seguridad y observabilidad, ver `.github/docs/lineamientos/dev-guidelines.md`.
