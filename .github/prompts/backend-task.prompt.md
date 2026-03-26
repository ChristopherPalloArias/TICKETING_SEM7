---
name: backend-task
description: Implementa una funcionalidad backend en microservicios Java/Spring Boot basada en una spec ASDD aprobada.
argument-hint: "<nombre-feature> (debe existir .github/specs/<nombre-feature>.spec.md)"
agent: Backend Developer
---

Implementa el backend para el feature especificado, siguiendo la spec aprobada.

**Feature**: ${input:featureName:nombre del feature en kebab-case}

## Pasos obligatorios:

1. **Lee la spec** en `.github/specs/${input:featureName:nombre-feature}.spec.md` — si no existe, detente e informa al usuario.
2. **Revisa el código existente** en `ms-*/src/main/java/` para entender patrones actuales.
3. **Implementa en orden**:
  - `ms-*/src/main/java/.../model` o `dto` — entidades/DTOs
  - `ms-*/src/main/java/.../repository` — repositorio JPA
  - `ms-*/src/main/java/.../service` — servicio con lógica de negocio
  - `ms-*/src/main/java/.../controller` — controlador REST
4. **Registra/expone el endpoint** en el controlador correspondiente.
5. **Verifica compilación y tests** ejecutando: `./gradlew clean test`

## Restricciones:
- Sigue constructor injection en controladores/servicios.
- NO acceder a BD desde controladores.
- Usa transacciones (`@Transactional`) cuando aplique.
