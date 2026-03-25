---
applyTo: "ms-*/src/main/java/**/*.java"
---

> **Scope**: Se aplica a proyectos backend Java 17+ con Spring Boot 3.x bajo arquitectura de microservicios.

# Instrucciones para Archivos de Backend (Java/Spring Boot)

## Arquitectura en Capas

Siempre sigue la arquitectura en capas del microservicio:

```
controllers → services → repositories → PostgreSQL
```

- **`src/main/java/.../controller/`**: Parsear HTTP, validar entrada y delegar al service.
- **`src/main/java/.../service/`**: Lógica de negocio y orquestación transaccional.
- **`src/main/java/.../repository/`**: Único lugar con acceso a BD usando Spring Data JPA.
- **`src/main/java/.../model/`** y/o **`dto/`**: Entidades y contratos de entrada/salida.

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
1. Crear o actualizar controlador en la capa de entrada.
2. Implementar/ajustar servicio con reglas de negocio.
3. Implementar/ajustar repositorio JPA y modelo de datos.
4. Validar contrato de request/response según spec aprobada.

> Ver `README.md` para estructura real por microservicio (`api-gateway`, `ms-events`, `ms-ticketing`, `ms-notifications`).

## Nunca hacer

- Acceso a BD desde controladores.
- Publicar credenciales o secretos en código.
- Acoplar un microservicio directamente a la BD de otro.

---

> Para estándares de Clean Code, SOLID, REST, seguridad y observabilidad, ver `.github/docs/lineamientos/dev-guidelines.md`.
