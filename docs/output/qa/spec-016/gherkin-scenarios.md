# Gherkin Scenarios — SPEC-016: Configuración de Tiers, Publicación y Flujo Completo Admin

**Feature:** admin-tiers-publish-flow  
**SPEC:** SPEC-016  
**HUs:** HU-ADM-04 (Configuración de tiers y precios) · HU-ADM-05 (Flujo completo admin)  
**Generado por:** QA Agent / gherkin-case-generator  
**Fecha:** 2026-03-28  

---

## Datos de Prueba

| ID    | Escenario                 | Campo            | Válido                                            | Inválido                   | Borde                              |
|-------|---------------------------|------------------|---------------------------------------------------|----------------------------|------------------------------------|
| DP-01 | Detalle evento            | eventId          | `a1b2c3d4-0001-4000-8000-000000000001`            | `id-inexistente`           | UUID con formato válido sin evento |
| DP-02 | Agregar tier VIP          | tierType         | `VIP`                                             | `PREMIUM`                  | `""` (vacío)                       |
| DP-03 | Agregar tier              | price            | `120.00`                                          | `0`, `-10.00`              | `0.01` (mínimo)                    |
| DP-04 | Agregar tier              | quota            | `50`                                              | `0`, `-5`                  | `1` (mínimo)                       |
| DP-05 | Early Bird vigencia       | validFrom        | `2026-04-15T00:00:00`                             | `2026-05-01T00:00:00` (posterior a validUntil) | fecha actual (`2026-03-28T00:00:00`) |
| DP-06 | Early Bird vigencia       | validUntil       | `2026-04-30T23:59:59`                             | `2026-04-14T23:59:59` (anterior a validFrom) | misma fecha que validFrom          |
| DP-07 | Cupo vs aforo             | capacidadEvento  | `200`                                             | N/A                        | N/A                                |
| DP-08 | Cupo vs aforo             | cupoActualTotal  | `150` (deja margen)                               | `190` (margen mínimo: 10)  | `200` (aforo completo)             |
| DP-09 | Cupo vs aforo — overflow  | cupoNuevo        | `40` (150+40=190 ≤ 200)                           | `60` (150+60=210 > 200)    | `50` (150+50=200 = límite exacto)  |
| DP-10 | Publicación               | estadoEvento     | `DRAFT` con al menos un tier                      | `DRAFT` sin tiers          | `PUBLISHED` (ya publicado)         |
| DP-11 | Headers admin             | X-Role           | `ADMIN`                                           | `BUYER`, `""` (vacío)      | header ausente                     |
| DP-12 | Headers admin             | X-User-Id        | `550e8400-e29b-41d4-a716-446655440000`            | `""` (vacío)               | header ausente                     |
| DP-13 | Breadcrumbs               | ruta             | `/admin/events`, `/admin/events/new`, `/admin/events/:id` | N/A             | `/admin` (index)                   |
| DP-14 | Estado vacío dashboard    | cantidadEventos  | `0` (ninguno)                                     | N/A                        | N/A                                |
| DP-15 | Eliminar tier             | tierId           | `b2c3d4e5-0001-4000-8000-000000000010`            | `tier-inexistente`         | N/A                                |

---

```gherkin
#language: es
Característica: Configuración de Tiers, Publicación y Flujo Completo Admin

  Como Administrador
  Quiero configurar tiers (VIP, General, Early Bird) con precios y cupos,
  y publicar eventos desde el detalle del panel de administración
  Para definir la estructura comercial y hacer eventos visibles al público

  # =============================================================
  # HU-ADM-04 — HAPPY PATHS
  # =============================================================

  @smoke @critico @happy-path @CRITERIO-4.1
  Escenario: Vista de detalle del evento carga información y sección de tiers vacía
    Dado que el administrador está autenticado y accede a la ruta del detalle de un evento
      Y el evento tiene título "Romeo y Julieta", fecha "2026-05-10", sala "Sala Principal", aforo 200, estado DRAFT
      Y el evento no tiene tiers configurados
    Cuando la vista de detalle carga completamente
    Entonces se muestra la información del evento: título, fecha, sala, aforo, estado y metadata
      Y se muestra la sección "Configuración de Tiers"
      Y se muestra el mensaje "No hay tiers configurados aún"
      Y se muestra el botón "Agregar Tier"

  @smoke @critico @happy-path @CRITERIO-4.1
  Escenario: Vista de detalle del evento carga con tiers ya configurados
    Dado que el administrador está autenticado y accede al detalle de un evento con tiers
      Y el evento tiene un tier VIP (precio: $120, cupo: 50) y un tier GENERAL (precio: $60, cupo: 100)
    Cuando la vista de detalle carga completamente
    Entonces se muestran los tiers como lista de tarjetas (TierCard)
      Y se muestra la barra de progreso con cupo asignado vs aforo total

  @smoke @critico @happy-path @CRITERIO-4.2
  Escenario: Agregar nuevo tier VIP al evento DRAFT
    Dado que el administrador está en el detalle de un evento en estado DRAFT
      Y el evento tiene aforo 200 y cupo total asignado de 0
    Cuando hace clic en "Agregar Tier"
    Entonces aparece el formulario con campos: Tipo (dropdown VIP/GENERAL/EARLY_BIRD), Precio y Cupo
    Cuando selecciona tipo "VIP", ingresa precio "120.00" y cupo "50"
      Y hace clic en "Guardar Tier"
    Entonces el sistema llama al endpoint de agregar tier con los datos del formulario
      Y incluye los headers de autorización de administrador en la petición
      Y el tier VIP aparece en la lista de tiers sin recargar la página completa

  @smoke @critico @happy-path @CRITERIO-4.2
  Escenario: Agregar tier GENERAL al evento DRAFT
    Dado que el administrador está en el detalle de un evento en estado DRAFT
      Y ya tiene configurado un tier VIP con cupo 50 (aforo total: 200)
    Cuando hace clic en "Agregar Tier" y selecciona tipo "GENERAL", precio "60.00", cupo "100"
      Y hace clic en "Guardar Tier"
    Entonces el tier GENERAL aparece en la lista
      Y la barra de progreso muestra 150 de 200 asignados

  @smoke @critico @happy-path @CRITERIO-4.2
  Escenario: Campos de vigencia aparecen solo al seleccionar EARLY_BIRD
    Dado que el administrador está en el formulario de agregar tier
      Y selecciona tipo "VIP" inicialmente
    Cuando cambia el tipo a "EARLY_BIRD"
    Entonces aparecen los campos adicionales "Fecha inicio de vigencia" y "Fecha fin de vigencia"
    Cuando vuelve a seleccionar tipo "VIP"
    Entonces los campos de vigencia desaparecen del formulario

  @smoke @critico @happy-path @CRITERIO-4.3
  Escenario: Publicar evento DRAFT con tiers configurados
    Dado que el administrador está en el detalle de un evento en estado DRAFT
      Y el evento tiene al menos un tier configurado (VIP, precio: $120, cupo: 50)
    Cuando hace clic en "Publicar Evento"
    Entonces se muestra el modal de confirmación con el mensaje
      "¿Publicar este evento? Una vez publicado será visible para los compradores."
    Cuando confirma la publicación en el modal
    Entonces el sistema llama al endpoint de publicación con el header de rol ADMIN
      Y el estado del evento cambia a PUBLISHED en la interfaz
      Y los botones de gestión de tiers y el botón "Publicar Evento" se deshabilitan

  @smoke @critico @happy-path @CRITERIO-4.4
  Escenario: Lista de tiers con tarjetas y barra de progreso
    Dado que el evento tiene 3 tiers configurados: VIP ($120, 50 cupos), GENERAL ($60, 100 cupos), EARLY_BIRD ($40, 30 cupos con vigencia)
      Y el evento tiene aforo total de 200
    Cuando se renderiza la sección de tiers
    Entonces cada tier se muestra como tarjeta con: badge de tipo, precio, cupo
      Y el tier EARLY_BIRD muestra adicionalmente las fechas de vigencia
      Y la barra de progreso muestra "180 / 200 asignados"
      Y cada tier tiene visible el botón "Eliminar" (evento en DRAFT)

  @smoke @critico @happy-path @CRITERIO-4.5
  Escenario: Agregar tier EARLY_BIRD con vigencia temporal válida
    Dado que el administrador está en el formulario de agregar tier
    Cuando selecciona tipo "EARLY_BIRD", ingresa precio "40.00", cupo "30"
      Y define fecha inicio "15/04/2026" y fecha fin "30/04/2026"
      Y hace clic en "Guardar Tier"
    Entonces el sistema envía los campos validFrom y validUntil al backend
      Y la TierCard del Early Bird muestra las fechas de vigencia configuradas

  @happy-path @CRITERIO-4.4
  Escenario: Eliminar tier individual de evento DRAFT
    Dado que el evento está en estado DRAFT y tiene un tier VIP ($120, cupo: 50)
    Cuando el administrador hace clic en "Eliminar" en la TierCard del tier VIP
    Entonces el sistema llama al endpoint de eliminación con el identificador del tier
      Y el tier desaparece de la lista
      Y la barra de progreso se actualiza con el nuevo total de cupos asignados

  # =============================================================
  # HU-ADM-04 — ERROR PATHS
  # =============================================================

  @error-path @CRITERIO-4.6
  Escenario: Agregar tier con cupo que excede el aforo del evento
    Dado que el evento tiene aforo 200 y tiers con cupos sumando 150
    Cuando el administrador intenta agregar un tier con cupo "60" (150 + 60 = 210)
    Entonces el formulario muestra el error
      "La suma de cupos (210) excede el aforo del evento (200)"
      Y el botón "Guardar Tier" permanece deshabilitado
      Y no se realiza ninguna llamada al endpoint de agregar tier

  @error-path @CRITERIO-4.7
  Escenario: Precio igual a cero
    Dado que el administrador está en el formulario de agregar tier
    Cuando ingresa el precio "0" y hace clic fuera del campo
    Entonces se muestra el error inline "El precio debe ser mayor a $0"
      Y el botón "Guardar Tier" permanece deshabilitado

  @error-path @CRITERIO-4.7
  Escenario: Precio negativo
    Dado que el administrador está en el formulario de agregar tier
    Cuando ingresa el precio "-10.00"
    Entonces se muestra el error inline "El precio debe ser mayor a $0"
      Y no se permite enviar el formulario

  @error-path @CRITERIO-4.8
  Escenario: Early Bird con fecha inicio posterior a fecha fin
    Dado que el administrador agrega un tier EARLY_BIRD
    Cuando define fecha inicio "01/05/2026" y fecha fin "15/04/2026" (inicio > fin)
    Entonces se muestra el error de validación
      "La fecha de inicio debe ser anterior a la fecha de fin"
      Y el botón "Guardar Tier" permanece deshabilitado

  @error-path @CRITERIO-4.8
  Escenario: Early Bird con fechas iguales
    Dado que el administrador agrega un tier EARLY_BIRD
    Cuando define fecha inicio "15/04/2026" y fecha fin "15/04/2026" (iguales)
    Entonces se muestra el error de validación
      "La fecha de inicio debe ser anterior a la fecha de fin"
      Y no se permite enviar el formulario

  @error-path @CRITERIO-4.9
  Escenario: Cupo igual a cero
    Dado que el administrador está en el formulario de agregar tier
    Cuando ingresa el cupo "0"
    Entonces se muestra el error inline "El cupo debe ser mayor a 0"
      Y el botón "Guardar Tier" permanece deshabilitado

  @error-path @CRITERIO-4.9
  Escenario: Cupo negativo
    Dado que el administrador está en el formulario de agregar tier
    Cuando ingresa el cupo "-5"
    Entonces se muestra el error inline "El cupo debe ser mayor a 0"
      Y no se permite enviar el formulario

  @error-path @seguridad
  Escenario: Agregar tier sin header de autorización de administrador
    Dado que se intenta llamar al endpoint de agregar tier sin el header X-Role: ADMIN
    Cuando se envía la petición al backend
    Entonces el backend retorna error 403 Forbidden
      Y no se crea ningún tier

  @error-path @seguridad
  Escenario: Eliminar tier sin header de autorización de administrador
    Dado que se intenta llamar al endpoint de eliminar tier sin el header X-Role: ADMIN
    Cuando se envía la petición al backend
    Entonces el backend retorna error 403 Forbidden
      Y el tier permanece sin cambios

  # =============================================================
  # HU-ADM-04 — EDGE CASES
  # =============================================================

  @edge-case @CRITERIO-4.10
  Escenario: Gestión de tiers bloqueada en evento PUBLISHED
    Dado que el evento está en estado PUBLISHED
    Cuando el administrador accede a la página de detalle admin del evento
    Entonces no se muestra el botón "Agregar Tier"
      Y los botones "Eliminar" de todas las TierCards no se muestran
      Y el botón "Publicar Evento" no se muestra
      Y se muestra el badge "PUBLISHED" indicando el estado del evento

  @edge-case @CRITERIO-4.11
  Escenario: Botón Publicar deshabilitado cuando el evento no tiene tiers
    Dado que el evento está en estado DRAFT
      Y el evento no tiene ningún tier configurado
    Cuando se renderiza la página de detalle admin
    Entonces el botón "Publicar Evento" aparece deshabilitado (no es interactivo)
      Y se muestra el tooltip "Configura al menos un tier antes de publicar"

  @edge-case @CRITERIO-4.6
  Esquema del escenario: Validar combinaciones de cupo nuevo vs cupo disponible restante
    Dado que el evento tiene aforo "<aforo>" y cupo total asignado "<cupoActual>"
    Cuando el administrador intenta agregar un tier con cupo "<cupoNuevo>"
    Entonces el resultado es "<resultado>"
    Ejemplos:
      | aforo | cupoActual | cupoNuevo | resultado                          |
      | 200   | 150        | 50        | Tier agregado exitosamente         |
      | 200   | 150        | 51        | Error: suma excede aforo (201>200) |
      | 200   | 0          | 200       | Tier agregado exitosamente         |
      | 200   | 0          | 201       | Error: suma excede aforo (201>200) |
      | 200   | 199        | 1         | Tier agregado exitosamente         |

  @edge-case
  Escenario: Precio en límite mínimo aceptado ($0.01)
    Dado que el administrador está en el formulario de agregar tier
    Cuando ingresa el precio "0.01" (mínimo válido)
    Entonces no se muestra ningún mensaje de error de precio
      Y el botón "Guardar Tier" está habilitado para enviar

  @edge-case
  Escenario: Cupo en límite mínimo aceptado (1)
    Dado que el administrador está en el formulario de agregar tier
    Cuando ingresa el cupo "1" (mínimo válido)
    Entonces no se muestra ningún mensaje de error de cupo
      Y el botón "Guardar Tier" está habilitado para enviar

  @edge-case
  Escenario: Backend retorna 409 cuando evento no está en DRAFT al agregar tier
    Dado que el evento está en estado PUBLISHED
      Y el frontend tiene una condición de carrera (estado no sincronizado)
    Cuando se envía la petición de agregar tier al backend
    Entonces el backend retorna error 409 Conflict
      Y la interfaz muestra un mensaje de error comunicando que el evento no está en DRAFT

  @edge-case
  Escenario: Backend retorna 409 cuando suma de cupos excede aforo
    Dado que hay una condición de carrera entre dos administradores agregando tiers simultáneamente
    Cuando el backend detecta que la suma de cupos excedería el aforo al persistir
    Entonces el backend retorna error 409 Conflict
      Y la interfaz muestra el Error de conflicto de capacidad al usuario

  # =============================================================
  # HU-ADM-05 — HAPPY PATHS
  # =============================================================

  @smoke @critico @happy-path @CRITERIO-5.1
  Escenario: Flujo completo de creación y publicación de evento sin interrupciones
    Dado que el administrador está autenticado y se encuentra en el dashboard de eventos
    Cuando hace clic en "Crear Evento" y completa el formulario con datos válidos
      (título: "La Celestina", fecha: "2026-06-15", sala con aforo 300)
    Entonces es redirigido al detalle del evento recién creado
    Cuando agrega un tier VIP con precio $150 y cupo 100
      Y agrega un tier GENERAL con precio $80 y cupo 150
    Entonces los dos tiers aparecen en la lista con la barra al 83.3%
    Cuando hace clic en "Publicar Evento" y confirma en el modal
    Entonces el evento aparece como PUBLISHED en el dashboard de administración
      Y el evento es visible en la cartelera pública

  @smoke @critico @happy-path @CRITERIO-5.2
  Escenario: Breadcrumbs visibles y navegables en dashboard de eventos
    Dado que el administrador está autenticado y se encuentra en el dashboard de eventos
    Cuando la página se renderiza
    Entonces se muestran los breadcrumbs: "Admin > Eventos"
      Y el segmento "Admin" es clicable y navega a la raíz del panel
      Y el segmento "Eventos" está activo (no es un enlace)

  @smoke @critico @happy-path @CRITERIO-5.2
  Escenario: Breadcrumbs en página de creación de evento
    Dado que el administrador navega a la página de creación de evento
    Cuando la ruta es /admin/events/new
    Entonces se muestran los breadcrumbs: "Admin > Eventos > Crear"
      Y el segmento "Admin" y "Eventos" son clicables para regresar

  @smoke @critico @happy-path @CRITERIO-5.2
  Escenario: Breadcrumbs en página de detalle de evento muestran título
    Dado que el administrador navega al detalle de un evento con título "Romeo y Julieta"
    Cuando la ruta es /admin/events/:id
    Entonces se muestran los breadcrumbs: "Admin > Eventos > Romeo y Julieta"
      Y el título del evento (tercer segmento) está activo (no es enlace)

  @happy-path @CRITERIO-5.3
  Escenario: Separación visual entre panel admin y tienda pública
    Dado que el administrador navega por rutas bajo /admin/
    Cuando cualquier página admin se renderiza
    Entonces se muestra el AdminNavBar de la barra de navegación del panel
      Y se muestran los breadcrumbs encima del contenido principal
      Y NO se muestra el BottomNav de la tienda pública
      Y el color de acento del panel es visualmente distinto al de la tienda

  # =============================================================
  # HU-ADM-05 — EDGE CASES
  # =============================================================

  @edge-case @CRITERIO-5.4
  Escenario: Dashboard muestra estado vacío cuando no hay eventos
    Dado que no existen eventos registrados en el sistema
    Cuando el administrador accede al dashboard de eventos
    Entonces se muestra un estado vacío con ilustración
      Y se muestra el mensaje "No hay eventos aún. ¡Crea tu primer evento para comenzar!"
      Y se muestra el botón "Crear Primer Evento" que al hacer clic navega a la ruta de creación

  @edge-case @CRITERIO-5.2
  Escenario: Segmentos de breadcrumbs correctos al navegar hacia atrás con historial
    Dado que el administrador navegó: Dashboard → Detalle evento → (botón atrás del navegador)
    Cuando vuelve al dashboard usando los breadcrumbs "Eventos"
    Entonces la ruta activa es /admin/events
      Y los breadcrumbs se actualizan correctamente mostrando solo "Admin > Eventos"

  @edge-case @CRITERIO-5.3
  Escenario: BottomNav no se renderiza en ninguna ruta /admin/*
    Dado que el administrador navega por distintas páginas del panel
    Cuando accede a /admin/events, /admin/events/new y /admin/events/:id
    Entonces en ninguna de esas rutas se renderiza el componente BottomNav
```

---

## Resumen de Cobertura Gherkin

| Criterio      | HU         | Tipo         | Escenarios generados | Tags principales                    |
|---------------|------------|--------------|----------------------|-------------------------------------|
| CRITERIO-4.1  | HU-ADM-04  | Happy path   | 2                    | `@smoke @critico @happy-path`       |
| CRITERIO-4.2  | HU-ADM-04  | Happy path   | 4                    | `@smoke @critico @happy-path`       |
| CRITERIO-4.3  | HU-ADM-04  | Happy path   | 1                    | `@smoke @critico @happy-path`       |
| CRITERIO-4.4  | HU-ADM-04  | Happy path   | 2                    | `@smoke @critico @happy-path`       |
| CRITERIO-4.5  | HU-ADM-04  | Happy path   | 1                    | `@smoke @critico @happy-path`       |
| CRITERIO-4.6  | HU-ADM-04  | Error path   | 1 + 5 ejemplos       | `@error-path`                       |
| CRITERIO-4.7  | HU-ADM-04  | Error path   | 2                    | `@error-path`                       |
| CRITERIO-4.8  | HU-ADM-04  | Error path   | 2                    | `@error-path`                       |
| CRITERIO-4.9  | HU-ADM-04  | Error path   | 2                    | `@error-path`                       |
| Auth (extra)  | HU-ADM-04  | Error path   | 2                    | `@error-path @seguridad`            |
| CRITERIO-4.10 | HU-ADM-04  | Edge case    | 1                    | `@edge-case`                        |
| CRITERIO-4.11 | HU-ADM-04  | Edge case    | 1                    | `@edge-case`                        |
| Backend races | HU-ADM-04  | Edge case    | 2                    | `@edge-case`                        |
| Límites       | HU-ADM-04  | Edge case    | 2                    | `@edge-case`                        |
| CRITERIO-5.1  | HU-ADM-05  | Happy path   | 1                    | `@smoke @critico @happy-path`       |
| CRITERIO-5.2  | HU-ADM-05  | Happy path   | 3 + 2 edge           | `@smoke @critico @happy-path`       |
| CRITERIO-5.3  | HU-ADM-05  | Happy path   | 1 + 1 edge           | `@happy-path`                       |
| CRITERIO-5.4  | HU-ADM-05  | Edge case    | 1                    | `@edge-case`                        |

**Total escenarios:** 31 escenarios básicos + 5 ejemplos de esquema = **36 casos de prueba**
