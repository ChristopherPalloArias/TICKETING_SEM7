# Requirements — Requerimientos de Negocio

Este directorio contiene los requerimientos de negocio que están **listos para ser especificados** pero aún no tienen una spec generada.

## ¿Qué es un Requerimiento?

Un requerimiento es un documento que describe **qué necesita el negocio**, antes de que el `Spec Generator` lo convierta en una spec técnica ASDD. Es la entrada al pipeline ASDD.

## Lifecycle

```
requirements/<feature>.md  →  /generate-spec  →  specs/<feature>.spec.md
  (requerimiento de negocio)     (Spec Generator)    (especificación técnica)
```

## Cómo Usar

1. Crear un archivo `<feature>.md` en este directorio con la descripción del requerimiento
2. Ejecutar `/generate-spec` o usar `@Spec Generator` en Copilot Chat
3. Una vez generada la spec en `.github/specs/`, el requerimiento puede archivarse o eliminarse

## Convención de Nombres

```
.github/requirements/<nombre-feature-kebab-case>.md
```

## Requerimientos Pendientes

| Feature | Archivo | Estado |
|---------|---------|--------|
| Backlog Ticketing (HU-01..HU-07) | `ticketing-historias.md` | LISTO PARA SPEC |
| Cartelera Frontend (HU-FE-01..HU-FE-07) | `cartelera-frontend.md` | EN SPEC |
| Detalle de Evento Frontend (HU-FE-08..HU-FE-12) | `detalle-evento-frontend.md` | LISTO PARA SPEC |
| Checkout y Pago Frontend (HU-FE-13..HU-FE-18) | `checkout-pago-frontend.md` | LISTO PARA SPEC |
| Notificaciones In-App (HU-NTF-01..HU-NTF-05) | `notificaciones-in-app.md` | LISTO PARA SPEC |
| Seguridad, Login y Admin Panel (HU-SEC-01..HU-SEC-08, HU-ADM-01..HU-ADM-05) | `seguridad-login-admin-panel.md` | LISTO PARA SPEC |

> Actualiza esta tabla al agregar o procesar requerimientos.
