# REALITY_CHECK.md

**Semana 7 — Expectativa vs Realidad**

---

## 1. Selección del MVP

Inicialmente, como equipo decidimos trabajar **todas las historias de usuario** definidas en el backlog. Esta decisión se tomó porque desde el diseño del sistema se planteó un alcance reducido y enfocado en lo mínimo necesario para simular una plataforma de venta de tickets, tomando como referencia sistemas reales existentes.

A diferencia de un enfoque tradicional de MVP (donde se reduce el alcance), en este caso el backlog ya representaba una versión simplificada del negocio, por lo que se optó por implementar un flujo completo end-to-end tanto para comprador como para administrador.

---

## 2. MVP Implementado (Realidad)

El sistema implementado permite un flujo funcional completo:

* Creación de eventos por parte del administrador
* Reserva de tickets
* Simulación de pago (mock)
* Notificaciones dentro del sistema

El flujo **end-to-end funciona correctamente**, aunque con ciertas simplificaciones importantes:

* No existe pasarela de pago real (mock de pago)
* No hay sistema de autenticación (login)
* Las notificaciones no son externas (correo), sino internas

Adicionalmente, se identificó una limitación funcional:

* El administrador puede crear eventos, pero **no puede editarlos ni eliminarlos**

Esto evidencia que, aunque el flujo principal está completo, aún hay funcionalidades clave de gestión que no están cubiertas.

---

## 3. Estimaciones vs Realidad

En general, los **Story Points estuvieron bien estimados**. No se percibieron desviaciones significativas en la mayoría de las tareas técnicas.

Sin embargo, se identificó una excepción importante:

### Subestimación

* **Desarrollo del frontend**

  * No estaba definido mediante historias de usuario específicas
  * No se consideró en la estimación inicial
  * Generó trabajo adicional no planificado

### Causa

* Enfoque inicial centrado únicamente en backend
* Subestimación del esfuerzo de integración visual y consumo de APIs

---

## 4. Integración entre Microservicios

Uno de los puntos más sólidos del proyecto fue la integración:

* RabbitMQ funciona correctamente
* Los eventos se publican y consumen entre microservicios
* La comunicación entre servicios es funcional

Esto permitió validar el flujo distribuido del sistema, lo cual era uno de los objetivos principales del taller.

---

## 5. Calidad y QA


---

## 6. Problemas Técnicos Encontrados

El principal bloqueo técnico fue:

### Notificaciones

* Inicialmente se plantearon como notificaciones por correo
* Al no existir sistema de autenticación (login), no había forma de asociar correos a usuarios
* Se decidió cambiar a **notificaciones internas dentro de la aplicación**

Esto implicó:

* Replantear el diseño original
* Adaptar la solución a las limitaciones del sistema actual

---

## 7. Deuda Técnica

Se identifican varios puntos de deuda técnica en el MVP:

* Uso de valores hardcodeados (especialmente en mocks)
* Logging limitado (poca trazabilidad)
* Validaciones mínimas (solo en creación de eventos)
* Falta de manejo robusto de errores
* Ausencia de autenticación/autorización real
* Falta de operaciones completas de administración (editar/eliminar eventos)

---

## 8. Valor del MVP

El MVP **sí aporta valor funcional**:

* Permite simular el flujo completo de compra de tickets
* Representa una base válida para evolución del sistema

Sin embargo, su uso en un entorno real está limitado por:

* Falta de autenticación
* Funcionalidades incompletas para administración
* Ausencia de integraciones reales (pagos, notificaciones externas)

---

## 9. Aprendizajes

Este taller permitió aplicar de forma práctica conceptos clave vistos en semanas anteriores:

* Arquitectura de microservicios
* Comunicación asíncrona con eventos
* Integración entre servicios
* Construcción de flujos end-to-end

Además, se evidenció la diferencia entre:

* Diseñar un sistema (teórico)
* Implementarlo (real)

---

## 10. Estado Actual del Sistema

Actualmente:

* El proyecto puede ejecutarse correctamente si se siguen las instrucciones del README
* Los microservicios están integrados y funcionales
* El flujo principal de negocio está operativo

Sin embargo:

* El sistema no está listo para producción
* Requiere mejoras en calidad, validaciones y experiencia de usuario

---

## 11. Conclusión

El objetivo del taller se cumplió en términos de lograr un sistema funcional e integrado.

A pesar de que se intentó cubrir todo el backlog, la experiencia evidenció que incluso en un alcance reducido existen desafíos importantes relacionados con integración, diseño y decisiones técnicas no previstas.

El resultado es un MVP funcional, pero con áreas claras de mejora que reflejan la realidad del desarrollo de software en entornos ágiles.
