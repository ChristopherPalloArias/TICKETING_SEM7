# Requerimiento: Backlog Ticketing (HU-01..HU-07)

## Contexto del proyecto

Sistema de venta de entradas para obras de teatro con microservicios Java 17+ y Spring Boot 3.x:
- `api-gateway`: punto de entrada, enrutamiento y CORS
- `ms-events`: catálogo de eventos, aforo y tiers (`VIP`, `General`, `Early Bird`)
- `ms-ticketing`: reservas, pago simulado, expiración automática con `@Scheduled` y publicación de eventos a RabbitMQ
- `ms-notifications`: consumo de eventos RabbitMQ y envío de notificaciones al comprador

Infraestructura objetivo:
- PostgreSQL independiente por microservicio
- RabbitMQ para integración asíncrona entre `ms-ticketing` y `ms-notifications`
- Docker + Docker Compose
- Gestión de proyecto con GitHub Projects

## Escala de estimación
Fibonacci: 1, 2, 3, 5, 8, 13

## Definition of Ready (DoR)
Una historia entra al sprint cuando:
- Formato Como / Quiero / Para redactado correctamente
- Valor de negocio identificable y claro
- Criterios de aceptación definidos en Gherkin
- Estimación en Story Points asignada
- Historia cargada en el tablero de GitHub Projects

## Definition of Done (DoD)
Una historia se considera terminada cuando:
- Formato Como / Quiero / Para completo y claro
- Criterios de aceptación escritos en Gherkin declarativo
- Escenarios cubren el camino feliz y los casos alternos o límite
- Tasking desglosado desde la perspectiva DEV y QA
- Estimación en Story Points asignada y justificada
- Historia registrada en el tablero de GitHub Projects
- Commit atómico subido al repositorio con mensaje descriptivo

---

## Historias de Usuario (orden de desarrollo)

### HU-01: Creación de evento de obra de teatro — SP: 5
Como Administrador
Quiero crear un evento de obra de teatro con su información base y aforo permitido
Para prepararlo para su configuración comercial y posterior publicación

**Microservicio:** `ms-events`
**Justificación SP:** Historia de complejidad media. Requiere persistencia, validaciones de negocio, control por rol, manejo de estado inicial y cobertura de pruebas de camino feliz y límites.

#### Criterios de Aceptación

**CA-01. Evento creado en estado borrador**
```gherkin
Escenario: Creación exitosa de evento
Dado que el administrador tiene acceso previamente habilitado al sistema
Y dispone de la información obligatoria del evento
Cuando registra un evento con datos válidos
Y define un aforo dentro del máximo permitido de la sala
Entonces el sistema crea el evento en estado borrador
```

**CA-02. Rechazo por aforo superior al máximo**
```gherkin
Escenario: Aforo superior al máximo de la sala
Dado que el administrador tiene acceso previamente habilitado al sistema
Y la sala tiene un aforo máximo definido
Cuando intenta registrar un evento con un aforo superior al permitido
Entonces el sistema rechaza la creación del evento
```

**CA-03. Rechazo por información obligatoria incompleta**
```gherkin
Escenario: Información mínima incompleta
Dado que el administrador tiene acceso previamente habilitado al sistema
Cuando intenta registrar un evento sin la información mínima requerida
Entonces el sistema no crea el evento
```

#### Subtasks

**DEV**
- [ ] Crear entidad y tabla `event`
- [ ] Implementar endpoint de creación de evento
- [ ] Validar información obligatoria del evento
- [ ] Validar `capacity` contra el máximo permitido de la sala
- [ ] Persistir evento en estado borrador
- [ ] Restringir creación a usuarios con rol administrador

**QA**
- [ ] Diseñar matriz de datos válidos e inválidos para creación de eventos
- [ ] Ejecutar prueba de creación exitosa con aforo permitido
- [ ] Ejecutar prueba de rechazo por aforo superior al máximo
- [ ] Ejecutar prueba de rechazo por información mínima incompleta
- [ ] Verificar que el evento quede en estado borrador al crearse

---

### HU-02: Configuración de tiers y precios por evento — SP: 5
Como Administrador
Quiero configurar los tiers, cupos y precios de una obra de teatro
Para ofrecer una estructura de venta alineada con la estrategia comercial del evento

**Microservicio:** `ms-events`
**Dependencia:** HU-01
**Justificación SP:** Complejidad media. Agrega reglas cruzadas entre precios, cupos, aforo y vigencia temporal, por lo que requiere mayor cobertura funcional y de consistencia.

#### Criterios de Aceptación

**CA-01. Configuración válida de tiers**
```gherkin
Escenario: Configuración comercial exitosa
Dado que existe un evento en estado borrador
Cuando el administrador define los tiers VIP, General y Early Bird
Y asigna cupos y precios válidos a cada tier
Entonces el sistema guarda la configuración comercial del evento
```

**CA-02. Vigencia temporal del Early Bird**
```gherkin
Escenario: Early Bird con vigencia válida
Dado que existe un evento en estado borrador
Cuando el administrador define una ventana de tiempo válida para el tier Early Bird
Entonces el sistema habilita ese tier únicamente dentro del período configurado
```

**CA-03. Rechazo por precio inválido**
```gherkin
Escenario: Precio no válido en un tier
Dado que existe un evento en estado borrador
Cuando el administrador asigna a un tier un precio igual o menor a cero
Entonces el sistema rechaza la configuración
```

**CA-04. Rechazo por suma de cupos mayor al aforo**
```gherkin
Escenario: Cupos por tier exceden el aforo total
Dado que existe un evento con aforo definido
Cuando la suma de cupos asignados a los tiers supera el aforo total del evento
Entonces el sistema no permite guardar la configuración
```

#### Subtasks

**DEV**
- [ ] Crear entidad y tabla `tier` asociada al evento
- [ ] Implementar endpoint de configuración comercial
- [ ] Validar tipos permitidos de tier: `VIP`, `General` y `Early Bird`
- [ ] Validar precios mayores a cero
- [ ] Validar cupos asignados por tier
- [ ] Validar que la suma de cupos no supere la `capacity` del evento
- [ ] Implementar vigencia temporal del tier `Early Bird`
- [ ] Persistir configuración comercial del evento en borrador

**QA**
- [ ] Diseñar matriz de datos para combinaciones de tiers, precios y cupos
- [ ] Validar configuración exitosa de VIP, General y Early Bird
- [ ] Validar vigencia correcta del Early Bird dentro del período definido
- [ ] Validar rechazo por precio igual a cero o negativo
- [ ] Validar rechazo por suma de cupos mayor al aforo
- [ ] Verificar que la configuración válida quede correctamente almacenada

---

### HU-03: Visualización de eventos y disponibilidad — SP: 3
Como Comprador
Quiero consultar los eventos disponibles y la disponibilidad por tier
Para elegir una entrada según mis preferencias y presupuesto

**Microservicio:** `ms-events`
**Dependencia:** HU-01, HU-02
**Justificación SP:** Historia de consulta con menor complejidad técnica que las transaccionales, pero con reglas de negocio claras sobre visibilidad y disponibilidad.

#### Criterios de Aceptación

**CA-01. Consulta de eventos publicados**
```gherkin
Escenario: Visualización de eventos disponibles
Dado que existen eventos publicados con entradas disponibles
Cuando el comprador consulta la cartelera
Entonces el sistema muestra los eventos disponibles para compra
Y presenta la disponibilidad vigente por tier
```

**CA-02. Tier agotado**
```gherkin
Escenario: Tier agotado
Dado que un tier ya no tiene entradas disponibles
Cuando el comprador consulta el detalle del evento
Entonces el sistema lo muestra como no disponible
```

**CA-03. Early Bird vencido**
```gherkin
Escenario: Early Bird fuera de vigencia
Dado que la ventana de tiempo del tier Early Bird ya finalizó
Cuando el comprador consulta el detalle del evento
Entonces el sistema no lo presenta como opción disponible
```

#### Subtasks

**DEV**
- [ ] Implementar consulta de eventos publicados
- [ ] Implementar consulta de disponibilidad por tier
- [ ] Filtrar eventos no publicados
- [ ] Excluir tiers agotados de la disponibilidad activa
- [ ] Excluir `Early Bird` fuera de vigencia
- [ ] Presentar disponibilidad vigente por tier

**QA**
- [ ] Diseñar datos de prueba para eventos publicados y no publicados
- [ ] Validar visualización de eventos publicados con entradas disponibles
- [ ] Validar que un tier agotado aparezca como no disponible
- [ ] Validar que Early Bird vencido no se muestre como opción disponible
- [ ] Verificar que solo se muestre disponibilidad vigente por tier

---

### HU-04: Reserva y compra de entrada con pago simulado — SP: 8
Como Comprador
Quiero reservar una entrada y completar un pago simulado dentro de un tiempo límite
Para asegurar mi acceso al evento sin perder disponibilidad durante el proceso

**Microservicio:** `ms-ticketing`
**Dependencia:** HU-03
**Justificación SP:** Historia de alta complejidad. Combina manejo de estados, tiempo límite, inventario, concurrencia y consistencia de datos.

#### Criterios de Aceptación

**CA-01. Compra exitosa dentro del tiempo permitido**
```gherkin
Escenario: Compra confirmada dentro del tiempo de reserva
Dado que existe disponibilidad para el tier seleccionado
Cuando el comprador genera una reservation
Y completa un mock payment exitoso antes de que transcurran 10 minutos
Entonces el sistema confirma la compra
Y descuenta la entrada del inventario disponible
```

**CA-02. Compra fallida por pago rechazado**
```gherkin
Escenario: Pago simulado rechazado
Dado que existe una reservation activa dentro del tiempo permitido
Cuando el sistema recibe un resultado de mock payment rechazado
Entonces la compra se marca como fallida
Y la entrada no queda confirmada para el comprador
```

**CA-03. Expiración de la reserva**
```gherkin
Escenario: Reserva expirada por tiempo
Dado que existe una reservation activa sin mock payment exitoso
Cuando transcurren 10 minutos desde su creación
Entonces el sistema expira la reservation
```

**CA-04. Protección ante compra simultánea**
```gherkin
Escenario: Última entrada solicitada por dos compradores
Dado que solo queda una entrada disponible en un tier
Cuando dos compradores intentan completar la compra de forma concurrente
Entonces el sistema confirma la compra para un solo comprador
Y evita la duplicidad de venta
```

#### Subtasks

**DEV**
- [ ] Crear entidad y tabla `reservation` con estado y `created_at` en UTC
- [ ] Implementar creación de `reservation` para un tier disponible
- [ ] Implementar servicio de `mock payment`
- [ ] Validar disponibilidad real antes de reservar
- [ ] Confirmar compra ante mock payment exitoso dentro del tiempo permitido
- [ ] Descontar inventario al confirmar la compra
- [ ] Evitar confirmación de compras sobre reservations vencidas
- [ ] Asociar compra confirmada con `ticket` emitido
- [ ] Manejar rechazo de mock payment sin confirmar la entrada

**QA**
- [ ] Diseñar matriz de datos para reservation y mock payment
- [ ] Ejecutar prueba de compra exitosa dentro del tiempo permitido
- [ ] Ejecutar prueba de compra fallida por mock payment rechazado
- [ ] Ejecutar prueba de expiration de reservation luego de 10 minutos
- [ ] Ejecutar prueba de doble intento sobre la última entrada disponible
- [ ] Verificar que una compra confirmada descuente inventario y genere ticket

---

### HU-05: Liberación automática por fallo de pago o expiración — SP: 8
Como Organizador del evento
Quiero que las entradas bloqueadas por reservas vencidas o pagos fallidos se liberen automáticamente
Para poder ofrecer nuevamente esos cupos a otros compradores

**Microservicio:** `ms-ticketing`
**Dependencia:** HU-04
**Justificación SP:** Historia de alta complejidad. El sistema debe actuar de forma autónoma en segundo plano, garantizando que ninguna entrada quede bloqueada ni se libere por equivocación.

#### Criterios de Aceptación

**CA-01. Liberación por expiración de reserva**
```gherkin
Escenario: Entrada liberada al vencerse la reserva
Dado que una reservation permanece sin mock payment exitoso
Cuando se cumple el tiempo máximo de 10 minutos
Entonces el sistema libera automáticamente la entrada asociada
```

**CA-02. Liberación por pago rechazado**
```gherkin
Escenario: Entrada liberada tras rechazo de pago
Dado que una reservation se encuentra activa
Cuando el sistema registra un mock payment rechazado
Entonces la entrada reservada vuelve a estar disponible
```

**CA-03. Disponibilidad actualizada luego de la liberación**
```gherkin
Escenario: Entrada visible nuevamente para otros compradores
Dado que una entrada fue liberada por expiration o mock payment fallido
Cuando otro comprador consulta la disponibilidad del evento
Entonces el sistema refleja nuevamente esa entrada como disponible
```

**CA-04. Recuperación ante falla del mecanismo principal**
```gherkin
Escenario: Recuperación ante falla del mecanismo principal
Dado que existe una reservation vencida que no fue liberada por el proceso principal
Cuando se ejecuta un proceso de verificación de respaldo
Entonces el sistema regulariza el estado de la reservation
Y libera la entrada correspondiente
```

#### Subtasks

**DEV**
- [ ] Implementar detección de reservations vencidas con `@Scheduled`
- [ ] Liberar automáticamente entradas de reservations expiradas
- [ ] Liberar automáticamente entradas de mock payments rechazados
- [ ] Actualizar `updated_at` en UTC al liberar la reservation
- [ ] Reflejar nuevamente la entrada en disponibilidad en `ms-events`
- [ ] Implementar proceso de respaldo para reservations no liberadas por el mecanismo principal
- [ ] Evitar liberación sobre tickets ya confirmados

**QA**
- [ ] Diseñar datos de prueba para reservations expiradas y mock payments rechazados
- [ ] Ejecutar prueba de liberación automática por expiration
- [ ] Ejecutar prueba de liberación automática por mock payment rechazado
- [ ] Verificar que la entrada liberada vuelva a aparecer disponible
- [ ] Ejecutar prueba de regularización por proceso de respaldo
- [ ] Verificar que un ticket confirmado no sea liberado erróneamente

---

### HU-06: Notificaciones al comprador — SP: 3
Como Comprador
Quiero recibir notificaciones inmediatas sobre el resultado de mi proceso de compra
Para conocer oportunamente el estado de mi reservation o compra

**Microservicio:** `ms-notifications`
**Dependencia:** HU-04, HU-05
**Eventos RabbitMQ escuchados:** `ticket.reserved`, `ticket.paid`, `ticket.expired`
**Justificación SP:** Historia pequeña-media. Tiene pocos flujos principales, pero depende de eventos del sistema y requiere control de duplicidad y trazabilidad.

#### Criterios de Aceptación

**CA-01. Notificación de compra exitosa**
```gherkin
Escenario: Notificación de compra confirmada
Dado que el comprador completa un mock payment exitoso
Cuando el sistema confirma la compra
Entonces el comprador recibe una notification de compra confirmada
```

**CA-02. Notificación de pago fallido**
```gherkin
Escenario: Notificación de pago rechazado
Dado que el comprador intenta completar el pago de una reservation
Cuando el sistema registra un rechazo de mock payment
Entonces el comprador recibe una notification de pago fallido
```

**CA-03. Notificación de liberación de reserva**
```gherkin
Escenario: Notificación de liberación por expiración
Dado que una reservation del comprador expira sin mock payment exitoso
Cuando el sistema libera la entrada
Entonces el comprador recibe una notification informando la liberación
```

#### Subtasks

**DEV**
- [ ] Implementar consumidor de eventos RabbitMQ (`ticket.reserved`, `ticket.paid`, `ticket.expired`)
- [ ] Implementar servicio simulado de notifications
- [ ] Enviar notification al confirmar compra
- [ ] Enviar notification al rechazar mock payment
- [ ] Enviar notification al liberar una reservation expirada
- [ ] Asociar el motivo correcto a cada notification emitida

**QA**
- [ ] Diseñar datos de prueba para eventos de notification
- [ ] Validar notification por compra exitosa
- [ ] Validar notification por mock payment fallido
- [ ] Validar notification por liberación de reservation
- [ ] Verificar correspondencia entre evento RabbitMQ y mensaje emitido

---

### HU-07: Visualización de ticket confirmado — SP: 2
Como Comprador
Quiero visualizar el ticket confirmado de mi compra
Para disponer de la evidencia de acceso al evento adquirido

**Microservicio:** `ms-ticketing`
**Dependencia:** HU-04
**Justificación SP:** Historia pequeña de consulta, pero con control de acceso e integridad de datos como aspectos críticos.

#### Criterios de Aceptación

**CA-01. Ticket disponible tras compra exitosa**
```gherkin
Escenario: Ticket visible después de una compra confirmada
Dado que el comprador completó una compra exitosa
Cuando consulta sus tickets emitidos
Entonces el sistema muestra el ticket confirmado de la compra
```

**CA-02. Ticket con información correcta**
```gherkin
Escenario: Datos correctos en el ticket
Dado que existe un ticket confirmado asociado a una compra exitosa
Cuando el comprador lo visualiza
Entonces el sistema muestra correctamente la información del event, el tier adquirido y la compra realizada
```

**CA-03. Ausencia de ticket en compra no confirmada**
```gherkin
Escenario: Compra sin ticket por no haberse confirmado
Dado que una reservation no finalizó con mock payment exitoso
Cuando el comprador consulta sus tickets
Entonces el sistema no genera ni muestra un ticket asociado a esa operación
```

#### Subtasks

**DEV**
- [ ] Implementar consulta de ticket confirmado por compra
- [ ] Mostrar datos del event, tier y compra
- [ ] Permitir visualización solo para compras confirmadas
- [ ] Restringir acceso al ticket al comprador propietario

**QA**
- [ ] Diseñar datos de prueba para tickets confirmados y no confirmados
- [ ] Validar visualización de ticket luego de compra exitosa
- [ ] Validar información correcta mostrada en el ticket
- [ ] Validar ausencia de ticket para compra no confirmada
- [ ] Verificar acceso solo del propietario al ticket

---

## Notas de dominio

- Usar terminología canónica en todo el código y documentación: `event`, `capacity`, `tier`, `reservation`, `ticket`, `mock payment`, `expiration`, `notification`
- Timestamps siempre en UTC: `created_at`, `updated_at`
- Integración entre microservicios mediante eventos RabbitMQ: `ticket.reserved`, `ticket.paid`, `ticket.expired`
- Orden de desarrollo: HU-01 → HU-02 → HU-03 → HU-04 → HU-05 → HU-06 → HU-07