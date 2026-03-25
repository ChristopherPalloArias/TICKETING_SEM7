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

## Orden de implementación
```
models → repositories → services → routes → registrar en punto de entrada
```

| Capa | Responsabilidad |
|------|-----------------|
| **Models / DTOs** | Validación de tipos e input/output (Create, Update, Response, Entity) |
| **Repositories** | Acceso a DB — queries CRUD sin lógica de negocio |
| **Services** | Lógica de negocio pura — orquesta repositorios |
| **Controllers** | Parsing HTTP + DI + delegar al service |

## Patrón de DI
- Usar constructor injection en controladores y servicios
- El service recibe repositorios por constructor

Ver patrones específicos del stack en `.github/instructions/backend.instructions.md`.

## Reglas
Ver `.claude/rules/backend.md` — async, naming, errores, timestamps.

## Restricciones
- Solo directorio de backend del proyecto. No tocar frontend.
- No generar tests (responsabilidad de `test-engineer-backend`).
