---
name: implement-backend
description: Implementa un feature completo en el backend. Requiere spec con status APPROVED en .github/specs/.
argument-hint: "<nombre-feature>"
---

# Implement Backend

## Prerequisitos
1. Leer spec: `.github/specs/<feature>.spec.md` — sección 2 (modelos, endpoints)
2. Leer stack: `.github/instructions/backend.instructions.md`
3. Leer arquitectura: `.github/instructions/backend.instructions.md`
4. Confirmar que la spec tenga `status: APPROVED` antes de escribir codigo

## Orden de implementación
```
entities/dtos -> repositories -> services -> controllers -> exceptions
```

| Capa | Responsabilidad |
|------|-----------------|
| **Entities / DTOs** | Modelo de dominio (JPA/Hibernate) + contratos de entrada/salida (Jakarta Validation) |
| **Repositories** | Acceso a DB — queries CRUD sin lógica de negocio |
| **Services** | Lógica de negocio pura — orquesta repositorios |
| **Controllers** | Parsing HTTP + DI + delegar al service |
| **Exceptions** | Errores de dominio y mapeo consistente a respuestas HTTP |

## Patrón de DI
- Usar constructor injection en controladores y servicios
- El service recibe repositorios por constructor

Ver patrones específicos del stack en `.github/instructions/backend.instructions.md`.

## Restricciones y Convenciones Obligatorias

- Tecnologia: Spring Boot, Spring Data JPA, Hibernate, PostgreSQL, Lombok, Jakarta Validation.
- Arquitectura: `Controller -> Service -> Repository -> Entity -> DTO -> Exception`.
- Dominio (cuando aplique a HU-01/HU-02): crear `Room` con `maxCapacity` y asociar `Event` a `Room`.
- Regla obligatoria: `Event.capacity <= Room.maxCapacity`.
- No usar rutas o patrones legacy (por ejemplo `routes` de otros stacks).

## Restricciones
- Solo directorio de backend del proyecto. No tocar frontend.
- No generar tests (responsabilidad de `test-engineer-backend`).

## Checklist de cumplimiento (obligatorio antes de cerrar)

- [ ] Stack implementado coincide con restricciones de tecnologia.
- [ ] Capas implementadas en orden y sin mezclar responsabilidades.
- [ ] Existe `Room.maxCapacity` y asociacion `Event -> Room` cuando lo exija la spec.
- [ ] Validaciones de dominio y Jakarta Validation aplicadas.
- [ ] Excepciones de dominio mapeadas a HTTP en handler global.
