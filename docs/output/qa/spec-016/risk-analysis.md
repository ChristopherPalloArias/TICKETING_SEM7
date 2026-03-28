# Matriz de Riesgos — SPEC-016: Configuración de Tiers, Publicación y Flujo Completo Admin

**Feature:** admin-tiers-publish-flow  
**SPEC:** SPEC-016  
**HUs:** HU-ADM-04 · HU-ADM-05  
**Generado por:** QA Agent / risk-identifier  
**Fecha:** 2026-03-28  
**Regla aplicada:** ASD (Alto=obligatorio, Medio=recomendado, Bajo=opcional)

---

## Resumen

| Total | Alto (A) | Medio (S) | Bajo (D) |
|-------|----------|-----------|----------|
| 15    | 5        | 7         | 3        |

---

## Matriz de Riesgos

| ID    | HU        | Descripción del Riesgo                                                                              | Factores                                             | Nivel | Testing      |
|-------|-----------|-----------------------------------------------------------------------------------------------------|------------------------------------------------------|-------|--------------|
| R-001 | HU-ADM-04 | Suma de cupos supera aforo del evento: validación frontend bypasseable o inconsistente con backend  | Lógica de negocio crítica, validación dual FE+BE     | A     | Obligatorio  |
| R-002 | HU-ADM-04 | Endpoint POST /tiers/add sin header X-Role: ADMIN permite agregar tiers sin autorización            | Autenticación/autorización, operación de escritura   | A     | Obligatorio  |
| R-003 | HU-ADM-04 | Endpoint DELETE /tiers/:tierId sin header X-Role: ADMIN permite eliminar tiers sin autorización     | Autenticación/autorización, operación destructiva    | A     | Obligatorio  |
| R-004 | HU-ADM-04 | Modificación de tiers en evento PUBLISHED: backend no rechaza si el estado no es DRAFT              | Operación sobre datos incorrectos, integridad datos  | A     | Obligatorio  |
| R-005 | HU-ADM-04 | Condición de carrera al agregar tiers concurrentes que juntos superan el aforo                      | Integridad concurrente, SLA de consistencia datos    | A     | Obligatorio  |
| R-006 | HU-ADM-04 | Validación de precio ≤ 0 y cupo ≤ 0 no detectada en frontend permite llamadas inválidas al backend  | Lógica de negocio, validación de entrada             | S     | Recomendado  |
| R-007 | HU-ADM-04 | Vigencia Early Bird con validFrom >= validUntil no validada en frontend antes de enviar al backend  | Lógica de negocio, campos condicionales              | S     | Recomendado  |
| R-008 | HU-ADM-04 | useEventTiers no refleja estado local optimista: recarga innecesaria o lista desincronizada         | Componente con múltiples dependencias, UX            | S     | Recomendado  |
| R-009 | HU-ADM-04 | TierCard muestra botón "Eliminar" en evento PUBLISHED por prop isDraft mal propagada                | Código nuevo sin historial, estado compartido        | S     | Recomendado  |
| R-010 | HU-ADM-04 | PublishModal confirma sin verificar que existan tiers: estado frontend desincronizado del backend   | Lógica de negocio, alta frecuencia de uso            | S     | Recomendado  |
| R-011 | HU-ADM-05 | Ruta /admin/events/:id registrada en SPEC-015 no conectada a EventDetailAdmin en App.tsx            | Componente con dependencias externas, código nuevo   | S     | Recomendado  |
| R-012 | HU-ADM-05 | Breadcrumbs no se actualizan al navegar por historial del navegador (botón atrás)                   | Alta frecuencia de uso, lógica de navegación         | S     | Recomendado  |
| R-013 | HU-ADM-05 | BottomNav renderizado en rutas /admin/* por condición de ruta mal configurada en App.tsx            | Componente con dependencias, afecta UX global        | S     | Recomendado  |
| R-014 | HU-ADM-04 | CapacityBar con colores incorrectos: tokens CSS no aplicados o lógica de umbral errónea (80%/100%)  | Ajuste estético/funcional, código nuevo              | D     | Opcional     |
| R-015 | HU-ADM-05 | Estado vacío del dashboard con mensaje y botón mal alineados o ilustración ausente                  | Ajuste estético de UI, impacto limitado              | D     | Opcional     |
| R-016 | HU-ADM-04 | Badge de tipo de tier (VIP/GENERAL/EARLY_BIRD) con color incorrecto en TierCard                    | Ajuste estético de UI, sin impacto funcional         | D     | Opcional     |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Suma de cupos supera aforo — validación dual FE+BE
- **Descripción:** La regla de negocio establece que `suma(quota_tiers) ≤ capacity_evento`. Esta validación debe aplicarse en frontend (tiempo real al escribir el cupo, usando `currentTotalQuota + nuevoQuota > eventCapacity`) y en backend (al persistir, recalculando con `calculateCurrentTotalQuota(eventId)`). Si alguna de las dos falla, se pueden crear tiers inválidos en base de datos o mostrar errores inconsistentes al usuario.
- **Mitigación técnica:**
  - Frontend: `TierForm` recibe `currentTotalQuota` y `eventCapacity` como props. Validar `currentTotalQuota + quota > eventCapacity` de forma reactiva al cambiar el campo cupo. Mostrar error inline sin llamar al backend.
  - Backend: `TierService.addSingleTier()` debe llamar `calculateCurrentTotalQuota(eventId)` antes de persistir. Si la suma supera `event.capacity` → lanzar excepción con status 409.
  - Test de integración end-to-end que llame directamente al endpoint con suma > aforo y verifique 409.
- **Tests obligatorios:**
  - `[TierService]` addSingleTier con cupo que excede aforo → 409 Conflict
  - `[TierService]` addSingleTier con cupo exactamente igual al aforo restante → 201 Created
  - `[TierForm]` cupo + currentTotalQuota > eventCapacity → error inline sin llamada HTTP
  - `[TierForm]` cupo + currentTotalQuota = eventCapacity → sin error, botón habilitado
- **Bloqueante para release:** ✅ Sí

### R-002: Endpoint POST /tiers/add sin autorización ADMIN
- **Descripción:** El endpoint `POST /api/v1/events/{eventId}/tiers/add` debe validar que el header `X-Role` sea exactamente `ADMIN`. Si la validación falta o es incorrecta (ej. case-insensitive mal configurado), cualquier cliente puede agregar tiers sin autenticación. Este vector compromete la integridad del catálogo de eventos.
- **Mitigación técnica:**
  - `TierService.addSingleTier()` debe validar `!role.equals("ADMIN")` y lanzar excepción con status 403 si no coincide.
  - Verificar que el header `X-User-Id` también sea validado (no vacío) para trazabilidad.
  - El `TierController` debe leer los headers con `@RequestHeader("X-Role")` y `@RequestHeader("X-User-Id")` y pasarlos al servicio.
- **Tests obligatorios:**
  - `[TierControllerTest]` POST /add sin header X-Role → 403 Forbidden
  - `[TierControllerTest]` POST /add con X-Role: BUYER → 403 Forbidden
  - `[TierControllerTest]` POST /add con X-Role: ADMIN → 201 Created
  - `[TierServiceTest]` addSingleTier con role null → lanza excepción de autorización
- **Bloqueante para release:** ✅ Sí

### R-003: Endpoint DELETE /tiers/:tierId sin autorización ADMIN
- **Descripción:** El endpoint `DELETE /api/v1/events/{eventId}/tiers/{tierId}` elimina un tier de forma irreversible. Sin validación de `X-Role: ADMIN`, cualquier cliente puede eliminar tiers de cualquier evento. Al ser una operación destructiva sin rollback, el riesgo es clasificado Alto.
- **Mitigación técnica:**
  - `TierService.deleteSingleTier()` debe validar `!role.equals("ADMIN")` → 403.
  - Verificar con `findByIdAndEventId(tierId, eventId)` que el tier pertenece al evento (evitar delete de tiers de otros eventos por manipulación de path params).
- **Tests obligatorios:**
  - `[TierControllerTest]` DELETE /:tierId sin header X-Role → 403 Forbidden
  - `[TierControllerTest]` DELETE /:tierId con X-Role: ADMIN → 204 No Content
  - `[TierServiceTest]` deleteSingleTier con tierId de otro evento → 404 Not Found
  - `[TierServiceTest]` deleteSingleTier con role no ADMIN → lanza excepción de autorización
- **Bloqueante para release:** ✅ Sí

### R-004: Modificación de tiers en evento no DRAFT
- **Descripción:** Las reglas de negocio indican que solo se pueden agregar/eliminar tiers si el evento está en estado `DRAFT`. Si el backend no valida el estado antes de ejecutar la operación, es posible modificar la estructura de precios de un evento ya `PUBLISHED`, afectando a compradores que ya adquirieron tickets a precios previamente anunciados.
- **Mitigación técnica:**
  - `TierService.addSingleTier()` y `deleteSingleTier()` deben cargar el evento y verificar `event.getStatus() == EventStatus.DRAFT`. Si no → lanzar excepción con status 409.
  - Frontend: el estado DRAFT también debe controlarse deshabilitando botones, pero el backend es la barrera definitiva.
- **Tests obligatorios:**
  - `[TierServiceTest]` addSingleTier en evento PUBLISHED → 409 Conflict
  - `[TierServiceTest]` addSingleTier en evento CANCELLED → 409 Conflict
  - `[TierServiceTest]` deleteSingleTier en evento PUBLISHED → 409 Conflict
  - `[EventDetailAdmin]` botones de gestión ocultos cuando evento es PUBLISHED (test frontend)
- **Bloqueante para release:** ✅ Sí

### R-005: Condición de carrera al agregar tiers concurrentes
- **Descripción:** Si dos administradores agregan tiers de forma simultánea (o en ventana de milisegundos), ambos pueden leer `currentTotalQuota = 150` antes de que cualquiera persista, y ambos agregar 40 cupos, resultando en 230 cupos asignados para un aforo de 200. La entidad `Tier` tiene campo `version` (optimistic locking) que debe activarse.
- **Mitigación técnica:**
  - Verificar que `calculateCurrentTotalQuota()` use una consulta con `SELECT ... FOR UPDATE` o que el optimistic locking de `@Version` en `Tier` dispare `OptimisticLockException` en caso de conflicto.
  - Alternativamente, la validación de suma puede hacerse dentro de una transacción `@Transactional` con lock del evento.
  - Frontend debe manejar el error 409 del backend y mostrar mensaje al usuario.
- **Tests obligatorios:**
  - `[TierServiceTest]` dos llamadas simultáneas que juntas exceden aforo → al menos una retorna 409
  - `[TierControllerTest]` respuesta 409 cuando backend detecta overflow en concurrencia
  - `[useEventTiers]` manejo de error 409 del backend → muestra mensaje de error al usuario
- **Bloqueante para release:** ✅ Sí

---

## Riesgos MEDIO — Detalle

### R-006: Validación de precio y cupo no detectada en frontend
- **Descripción:** Si la validación client-side de `price > 0` y `quota >= 1` no está correctamente implementada en `TierForm`, el usuario puede enviar valores inválidos. El backend los rechazará con 400, pero la experiencia de usuario será pobre y se generarán llamadas HTTP innecesarias.
- **Mitigación:** Validación reactiva en los campos al perder foco (`onBlur`) y antes de submit (`onSubmit`). Mostrar errores inline debajo de cada campo.
- **Tests recomendados:**
  - `[TierForm]` precio = 0 → muestra error inline, botón deshabilitado
  - `[TierForm]` precio = -1 → muestra error inline
  - `[TierForm]` cupo = 0 → muestra error inline, botón deshabilitado
- **Bloqueante para release:** ❌ No (backend valida como última barrera)

### R-007: Vigencia Early Bird no validada antes de enviar
- **Descripción:** Los campos `validFrom` y `validUntil` solo aparecen al seleccionar EARLY_BIRD. Si `validFrom >= validUntil`, el backend retorna 400. El frontend debe validar esta condición antes de la llamada para mostrar un mensaje contextual apropiado.
- **Mitigación:** Al cambiar cualquier campo de fecha EARLY_BIRD, calcular `new Date(validFrom) < new Date(validUntil)`. Si falla → error inline "La fecha de inicio debe ser anterior a la fecha de fin".
- **Tests recomendados:**
  - `[TierForm]` EARLY_BIRD con validFrom > validUntil → error inline, formulario no enviable
  - `[TierForm]` EARLY_BIRD con validFrom == validUntil → error inline
- **Bloqueante para release:** ❌ No

### R-008: useEventTiers desincronizado tras ADD/DELETE
- **Descripción:** Tras llamar a `addTier()` o `deleteTier()`, el hook debe actualizar el estado local sin recargar la página. Si usa `refresh()` (GET completo) en lugar de actualización optimista, habrá un flicker de UI. Si el estado no se actualiza, la lista de tiers no refleja el cambio hasta el próximo mount.
- **Mitigación:** `addTier()` debe hacer append del tier devuelto por el backend al array `tiers`. `deleteTier()` debe filtrar el tier eliminado del array. Solo llamar `refresh()` como fallback en caso de error.
- **Tests recomendados:**
  - `[useEventTiers]` addTier actualiza lista sin llamada GET adicional
  - `[useEventTiers]` deleteTier filtra tier del array local
- **Bloqueante para release:** ❌ No (no afecta integridad de datos)

### R-009: TierCard muestra "Eliminar" en evento PUBLISHED
- **Descripción:** La prop `isDraft: boolean` controla la visibilidad del botón "Eliminar" en `TierCard`. Si el componente padre `EventDetailAdmin` no pasa `isDraft` correctamente (ej. defecto `true` o olvida actualizar al cambiar estado), los botones de eliminación quedan visibles tras publicar.
- **Mitigación:** En `EventDetailAdmin`, calcular `isDraft = event.status === 'DRAFT'` y pasarlo a cada `TierCard`. Verificar que tras el PATCH publish el estado se actualice en el estado local.
- **Tests recomendados:**
  - `[TierCard]` isDraft=false → botón "Eliminar" no se renderiza
  - `[EventDetailAdmin]` tras publicación → todos los TierCard reciben isDraft=false
- **Bloqueante para release:** ❌ No (el backend rechaza el DELETE igualmente)

### R-010: PublishModal disponible cuando no hay tiers
- **Descripción:** El botón "Publicar Evento" debe estar deshabilitado si `tiers.length === 0`. Si el estado `tiers` del hook se inicializa como vacío pero el botón no se deshabilita hasta que carga, hay una ventana donde el usuario puede intentar publicar sin tiers. El backend rechazará la publicación, pero la UX será confusa.
- **Mitigación:** Deshabilitar el botón "Publicar Evento" cuando `tiers.length === 0 || loading === true`. Mostrar tooltip explicativo.
- **Tests recomendados:**
  - `[EventDetailAdmin]` sin tiers → botón "Publicar Evento" disabled + tooltip
  - `[EventDetailAdmin]` con al menos 1 tier → botón habilitado
- **Bloqueante para release:** ❌ No

### R-011: Ruta /admin/events/:id no conectada a EventDetailAdmin
- **Descripción:** La ruta `/admin/events/:id` fue registrada en SPEC-015 pero apuntaba a un placeholder. Si la integración en `App.tsx` entre la ruta y `EventDetailAdmin` falla (import incorrecto, ruta duplicada), el detalle del evento no renderiza. Este riesgo es de integración entre specs.
- **Mitigación:** Verificar en `App.tsx` que `Route path="/admin/events/:id"` tiene `element={<EventDetailAdmin />}` y que el import es correcto.
- **Tests recomendados:**
  - `[AppRoutes]` navegación a /admin/events/:id renderiza EventDetailAdmin
- **Bloqueante para release:** ❌ No (detectable inmediatamente en smoke test)

### R-012: Breadcrumbs no responden al historial del navegador
- **Descripción:** `useBreadcrumbs` usa `useLocation()` de React Router, que sí se actualiza al navegar. Sin embargo, si hay memoización incorrecta (`useMemo` con dependencias vacías), los breadcrumbs pueden mostrar la ruta anterior.
- **Mitigación:** Asegurar que `useLocation()` está en las dependencias del `useMemo` o `useEffect` que genera los segmentos.
- **Tests recomendados:**
  - `[useBreadcrumbs]` cambio de ruta → segmentos se actualizan correctamente
- **Bloqueante para release:** ❌ No

### R-013: BottomNav visible en rutas /admin/*
- **Descripción:** Si la condición que oculta `BottomNav` en `App.tsx` usa `pathname.startsWith('/admin')` pero hay un error tipográfico o la condición se evalúa fuera del router context, el BottomNav puede renderizarse en páginas admin causando conflicto visual con AdminNavBar.
- **Mitigación:** Verificar en `App.tsx` / `AdminLayout` que `BottomNav` solo se renderiza cuando `!pathname.startsWith('/admin')`.
- **Tests recomendados:**
  - `[AppRoutes]` rutas /admin/* → BottomNav no presente en DOM
  - `[AppRoutes]` rutas públicas → BottomNav presente en DOM
- **Bloqueante para release:** ❌ No (visual, no afecta funcionalidad core)

---

## Riesgos BAJO — Referencia

| ID    | Descripción                                           | Acción sugerida                                           |
|-------|-------------------------------------------------------|-----------------------------------------------------------|
| R-014 | CapacityBar: colores de umbral (80%/100%) incorrectos | Verificar lógica `percentage >= 80` y tokens CSS         |
| R-015 | Estado vacío del dashboard: diseño desalineado        | Prueba visual / snapshot en pipeline CI                   |
| R-016 | Badges de TierCard con color incorrecto por tipo      | Mapeo de clases CSS: VIP=morado, GENERAL=azul, EB=naranja |

---

## Resumen de Cobertura por Componente

| Componente / Módulo          | Riesgos Alto | Riesgos Medio | Riesgos Bajo |
|------------------------------|:------------:|:-------------:|:------------:|
| TierService (backend)        | R-001, R-002, R-003, R-004, R-005 | — | — |
| TierController (backend)     | R-002, R-003 | — | — |
| TierForm (frontend)          | R-001        | R-006, R-007 | — |
| TierCard (frontend)          | R-004        | R-009        | R-016 |
| CapacityBar (frontend)       | —            | —            | R-014 |
| useEventTiers (hook)         | R-005        | R-008        | — |
| EventDetailAdmin (página)    | R-004        | R-009, R-010, R-011 | — |
| Breadcrumbs / useBreadcrumbs | —            | R-012        | — |
| App.tsx / rutas              | —            | R-011, R-013 | — |
| Dashboard (HU-ADM-05)        | —            | —            | R-015 |
| PublishModal                 | —            | R-010        | — |
