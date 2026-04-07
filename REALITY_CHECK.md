# REALITY_CHECK.md
**Semana 7 — Expectativa vs Realidad**

## 1. Selección del MVP

Inicialmente, el equipo decidió abordar todas las historias de usuario definidas en el backlog. Esta decisión se fundamentó en que el alcance planteado originalmente ya correspondía a una versión reducida del modelo de negocio, enfocada estrictamente en el flujo transaccional de venta de entradas para eventos teatrales.

En lugar de construir el MVP reduciendo en exceso el backlog, se optó por implementar y validar un flujo end-to-end completo que abarcara las operaciones críticas tanto del administrador como del comprador.

## 2. Alcance original vs realidad implementada

En la fase de planeación (`PRD.md`), se documentó qué funcionalidades componían el MVP y cuáles se excluían.

### Alcance comprometido del MVP

Se priorizaron las siguientes características:
- Creación de eventos.
- Configuración de categorías (tiers) y precios.
- Visualización de disponibilidad en tiempo real.
- Reserva temporal de entradas (vigencia de 10 minutos).
- Pago simulado (mock).
- Liberación automática de inventario por expiración o rechazo.
- Notificaciones en sistema.
- Generación y visualización del ticket confirmado.

### Funcionalidades excluidas en el alcance original

En el documento de requisitos quedaron fuera del alcance:
- Registro de usuarios.
- Inicio de sesión y autenticación.
- Pasarela de pago real (integración bancaria).
- Notificaciones externas por correo.
- Operaciones avanzadas de administración (modificación/eliminación de eventos).

### Realidad implementada (Hallazgos de la auditoría)

De la revisión del repositorio y la arquitectura de microservicios (`TICKETING_SEM7`), se concluye que el equipo cubrió la totalidad del MVP comprometido y, adicionalmente, implementó componentes que excedían el alcance estipulado.

La diferencia más notable es la existencia de un flujo de **autenticación y registro**. Aunque estaba fuera del alcance inicial, se implementó en un servicio dedicado (`api-gateway` mediante su `AuthController`) utilizando validación JWT (`JwtAuthenticationFilter`), conectando a persistencia propia (`postgres-gateway`) y soportado por vistas de frontend específicas (`BuyerLoginPage`, `BuyerRegisterPage`). Esto debe considerarse como trabajo suplementario no planificado y no como métrica de cumplimiento del MVP original.

También se incorporó un **API Gateway** centralizando las peticiones hacia la arquitectura, un patrón arquitectónico no requerido explícitamente en el PRD.

En cuanto a las limitaciones, el módulo administrativo se mantuvo circunscrito a la creación de eventos, cumpliendo la restricción original de no soportar operaciones de edición o eliminación profunda de registros.

## 3. Estimaciones vs realidad

Los esfuerzos previstos en Story Points coincidieron razonablemente con la complejidad técnica del módulo transaccional (inventario y reservas).

### 3.1 Subestimaciones detectadas

Se identificaron tareas cuyo esfuerzo final excedió lo planificado:

**Desarrollo Frontend**
El trabajo de interfaz gráfica no fue detallado atómicamente al inicio, resultando en mayor demanda de esfuerzo para consumo asíncrono de APIs, integración visual del carrito, manejo del temporizador e integración del login suplementario descrito.

**Testabilidad en el Backend**
El esfuerzo para certificar escenarios temporalmente dependientes (como expirar reservas de 10 minutos o la vigencia de tarifas anticipadas "Early Bird") fue subestimado. Fue necesario programar controladores dedicados a pruebas (ej. `TestabilityController` en `ms-events` y `ms-ticketing`) para forzar la aceleración de tiempos y la limpieza de inventario de forma controlada.

**Documentación de QA**
La unificación de matrices y la transcripción de las actas de ejecución (`TEST_CASES.md`, `TEST_PLAN.md`) demandaron tiempo logístico mayor al previsto.

## 4. Integración entre microservicios

El sistema fue analizado en su comportamiento distribuido y se observó lo siguiente:
- La comunicación asincrónica a través de `RabbitMQ` operó según el diseño (`@RabbitListener` activando señales de facturación, vencimiento y cancelación).
- Se establecieron las peticiones síncronas esperadas a través del componente `api-gateway` direccionadas hacia `ms-events`, `ms-ticketing` y `ms-notifications`.
- La configuración estipulada en `docker-compose` logró desplegar la red de servicios y las bases de datos de forma contenida.

Se confirmó que las transacciones en red resolvieron las necesidades base del flujo transaccional.

## 5. Calidad y QA

La calidad se trabajó de forma estructurada y en paralelo al desarrollo, no como una fase aislada al final del ciclo.

### 5.1 Cómo se garantizó la calidad en poco tiempo

La estrategia de QA se apoyó en los siguientes frentes:
- Definición de la estrategia general de pruebas en `TEST_PLAN.md`.
- Construcción y actualización de la matriz de casos en `TEST_CASES.md`.
- Automatización de pruebas API con Karate DSL.
- Trazabilidad directa entre historias de usuario, criterios de aceptación y casos de prueba.
- Uso de mecanismos de testability para validar escenarios temporales sin depender de esperas reales de 10 minutos.

### 5.2 Informe estadístico de validación

Al cierre del ciclo se logró:
- **29** casos de prueba ejecutados.
- **29** casos con estado `Pasó`.
- **7** historias de usuario cubiertas.
- **24** criterios de aceptación cubiertos.

### 5.3 Realidad técnica de las pruebas

Un hallazgo importante fue que algunos escenarios no podían validarse de forma estable si el backend no ofrecía soporte de testabilidad. Por ello fue necesario trabajar con mecanismos controlados para forzar la ejecución de procesos programados (`@Scheduled`) sin depender de tiempos reales, especialmente en expiración de reservas, vigencia de Early Bird y el job de respaldo.

## 6. Problemas técnicos encontrados

A lo largo del ciclo se tomaron decisiones para estabilizar el sistema.

### 6.1 Notificaciones

Inicialmente se consideró enviar notificaciones por correo electrónico. Sin embargo, el sistema se consolidó con notificaciones internas, procesadas a través de RabbitMQ y consultables dentro de la propia interfaz del sistema. Esta decisión permitió cerrar el flujo funcional sin incorporar una integración externa que no formaba parte del MVP.

### 6.2 Lógica temporal

La validación de expiración de reservas y vigencia del Early Bird representó una dificultad importante. Esperar tiempos reales no era viable para una automatización estable, por lo que fue necesario trabajar con mecanismos controlados en el entorno de prueba.

### 6.3 Concurrencia

La validación de la última entrada disponible fue uno de los escenarios más sensibles del proyecto. Se verificó que dos compradores intentando pagar simultáneamente la misma entrada no generaran sobreventa, delegando el control de atomicidad al bloqueo optimista en base de datos (JPA/PostgreSQL).

## 7. Deuda técnica

El sistema quedó funcional, pero mantiene deuda técnica para una siguiente iteración.

### 7.1 Deuda funcional
- Las operaciones administrativas no presentan un CRUD normalizado (falta modificación/eliminación).
- No existe pasarela de pago real.
- Las notificaciones no salen a canales externos.

### 7.2 Deuda técnica
- Existen valores hardcodeados en configuraciones y mocks.
- La observabilidad y el logging podrían mejorar.
- Los endpoints de `Testability` incorporados presentan un riesgo estructural si se exponen en un entorno productivo y deberán removerse o migrarse a variables de configuración estrictas.

## 8. Valor real del MVP

El MVP sí aporta valor funcional real.

Permite demostrar que el núcleo de negocio fue resuelto correctamente:
- Disponibilidad real del inventario.
- Reserva temporal con liberación automática.
- Confirmación o rechazo de compra.
- Notificación del resultado.
- Ticket generado tras compra exitosa.

Adicionalmente, las funcionalidades extra construidas (login/registro y API Gateway) suman valor técnico al proyecto, aunque no formaban parte del alcance base comprometido.

En consecuencia, el valor del MVP debe entenderse en dos niveles:
- **Valor comprometido:** el flujo principal de ticketing fue construido y validado.
- **Valor adicional:** el equipo incorporó capacidades extra fuera del alcance inicial.

## 9. Aprendizajes

Este taller permitió aplicar de forma práctica conceptos que normalmente se abordan desde la teoría.

**Técnicos:**
- Diseñar microservicios no es lo mismo que integrarlos correctamente.
- Los procesos asíncronos y temporales exigen más cuidado en pruebas del esperado.
- La prevención de sobreventa es un problema crítico tanto de negocio como de implementación.

**De QA:**
- Un caso documental no basta si no se alinea con la ejecución real.
- La trazabilidad entre HU, CA, TC y evidencia fortalece el entregable.
- La calidad también depende de la testabilidad del backend.

**De producto:**
- Un backlog pequeño no significa un proyecto simple.
- Las funcionalidades extra deben distinguirse del alcance comprometido para no confundir el criterio de éxito.

## 10. Estado actual del sistema

Actualmente, el sistema puede ejecutarse correctamente si se siguen las instrucciones del README. Los microservicios están integrados y funcionales, el flujo principal de negocio opera según lo esperado, y existe una suite de pruebas automatizadas que respalda el comportamiento del MVP.

Sin embargo, el sistema no debe considerarse listo para producción, debido a las simplificaciones propias del MVP (pago simulado, notificaciones internas) y a la deuda técnica pendiente.

## 11. Conclusión

El objetivo del taller se cumplió: se construyó un sistema funcional, integrado y validado sobre el núcleo de negocio definido para el MVP.

La realidad del proyecto mostró que, aunque el backlog era reducido, la implementación exigió resolver desafíos importantes de integración, concurrencia, testabilidad y cierre documental. También evidenció que el equipo fue capaz de ir más allá del alcance base, incorporando funcionalidades adicionales como autenticación y API Gateway que no estaban comprometidas inicialmente.

El resultado final es un MVP con valor funcional real, respaldado por cobertura formal de pruebas y con una visión clara de qué se logró, qué se agregó como valor extra y qué queda pendiente para una evolución posterior.

---

### Resultado final del ciclo

- **29** casos ejecutados
- **29** casos en estado `Pasó`
- **7** historias de usuario cubiertas
- **24** criterios de aceptación cubiertos

**Elaborado por:** Christopher Ismael Pallo Arias (QA) y Luis Alfredo Pinzón Quintero (DEV)
