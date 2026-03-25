---
description: 'Ejecuta el Database Agent para diseñar esquemas de datos, generar scripts de migración, seeders y optimizar queries a partir de la spec aprobada.'
agent: Database Agent
---

Ejecuta el Database Agent (MARCO DB) para diseñar y gestionar el modelo de persistencia del feature.

**Feature**: ${input:featureName:nombre del feature en kebab-case}

**Instrucciones para @Database Agent:**

1. Lee `.github/instructions/backend.instructions.md` — confirma el motor de BD aprobado
2. Lee `.github/docs/lineamientos/dev-guidelines.md`
3. Lee la **Sección 2 — DISEÑO — Modelos de Datos** de `.github/specs/${input:featureName}.spec.md`
4. Escanea modelos y repositorios existentes en `ms-*/src/main/java/.../model/` y `ms-*/src/main/java/.../repository/`
5. Ejecuta el flujo completo:
   - Diseña o actualiza el esquema de datos (entidades, campos, índices)
   - Genera/ajusta entidades JPA y DTOs en el microservicio correspondiente
   - Genera migraciones SQL (Flyway/Liquibase) para PostgreSQL
   - Genera seed de datos sintéticos de desarrollo (si aplica)
   - Registra ADR si hay decisiones de diseño relevantes
6. Presenta reporte consolidado de cambios al modelo de datos

**Prerequisito:** Debe existir `.github/specs/${input:featureName}.spec.md` con estado APPROVED y Sección 2 completa. Si no, ejecutar `/generate-spec` primero.

**Nota:** Ejecutar ANTES o en paralelo con el Backend Developer para que los contratos de persistencia estén definidos antes de implementar los repositorios.
