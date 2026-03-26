---
name: generate-tests
description: Genera pruebas unitarias para backend Java (JUnit/Mockito) y/o frontend en paralelo, basadas en la spec ASDD y el código implementado.
argument-hint: "<nombre-feature> [--backend] [--frontend] (por defecto genera ambos en paralelo)"
agent: Orchestrator
---

Genera pruebas unitarias completas para el feature especificado.

**Feature**: ${input:featureName:nombre del feature en kebab-case}
**Scope**: ${input:scope:backend, frontend, o ambos en paralelo (default)}

## Pasos obligatorios:

1. **Lee la spec** en `.github/specs/${input:featureName:nombre-feature}.spec.md` — sección "Plan de Pruebas Unitarias".
2. **Si scope es "ambos"**: lanza en paralelo `Test Engineer Backend` + `Test Engineer Frontend`.
3. **Si scope es "backend"**: delega a `Test Engineer Backend`:
   - `ms-*/src/test/java/.../service/${input:featureName:feature}ServiceTest.java`
   - `ms-*/src/test/java/.../repository/${input:featureName:feature}RepositoryTest.java`
   - `ms-*/src/test/java/.../controller/${input:featureName:feature}ControllerTest.java`
4. **Si scope es "frontend"**: delega a `Test Engineer Frontend`:
   - `frontend/src/__tests__/components/[Feature].test.jsx`
   - `frontend/src/__tests__/hooks/use[Feature].test.js`
   - `frontend/src/__tests__/pages/[Feature]Page.test.jsx`
5. **Verifica** que los tests corren:
   - Backend: `./gradlew test`
   - Frontend: `cd frontend && npx vitest run`

## Cobertura obligatoria por test:
- ✅ Happy path (flujo exitoso)
- ❌ Error path (excepciones, errores de red, datos inválidos)
- 🔲 Edge cases (campos vacíos, duplicados, permisos)

## Restricciones:
- Cada test debe ser independiente (no compartir estado).
- Mockear SIEMPRE las dependencias externas (DB, RabbitMQ, APIs).
- Para backend: usar `JUnit 5` + `Mockito`.
- Para frontend: usar `vitest` + `@testing-library/react`.
