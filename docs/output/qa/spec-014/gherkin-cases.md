# Gherkin Cases — SPEC-014: Login de Administrador y Protección de Rutas (Frontend)

**Feature:** admin-auth-frontend  
**SPEC:** SPEC-014  
**HU:** HU-ADM-01  
**Generado por:** QA Agent / gherkin-case-generator  
**Fecha:** 2026-03-28  

---

## Datos de Prueba

| ID   | Escenario          | Campo       | Válido                            | Inválido                  | Borde                         |
|------|--------------------|-------------|-----------------------------------|---------------------------|-------------------------------|
| DP-1 | Login              | email       | `admin@sem7.com`                  | `otro@email.com`          | `""` (vacío)                  |
| DP-2 | Login              | password    | `admin123`                        | `clave_incorrecta`        | `""` (vacío)                  |
| DP-3 | Login              | userId      | `550e8400-e29b-41d4-a716-446655440000` | N/A                  | N/A                           |
| DP-4 | localStorage       | key         | `sem7_admin_session`              | N/A                       | N/A                           |
| DP-5 | localStorage       | valor JSON  | `{"role":"ADMIN","userId":"550e8400-...","email":"admin@sem7.com"}` | `corrupted-json{{{` | `{"role":"USER","userId":"...","email":"..."}` |
| DP-6 | Rutas protegidas   | ruta        | `/admin/events`                   | N/A                       | `/admin` (index)              |
| DP-7 | Rutas públicas     | ruta        | `/eventos`, `/eventos/abc-123`    | N/A                       | `/`                           |

---

```gherkin
#language: es
Característica: Login de Administrador y Protección de Rutas (Frontend)

  Como Administrador
  Quiero ingresar al panel de administración con mis credenciales
  Para acceder a las funcionalidades de gestión de eventos de forma segura

  # =========================================================
  # HAPPY PATHS
  # =========================================================

  @smoke @critico @happy-path @CRITERIO-1.1
  Escenario: Login exitoso con credenciales de demo
    Dado que el administrador está en la página de login (/admin/login)
      Y no existe sesión activa en el almacenamiento local
    Cuando ingresa el email "admin@sem7.com" y la contraseña "admin123"
      Y presiona "Iniciar Sesión"
    Entonces el sistema establece la sesión con role "ADMIN"
      Y el userId queda como "550e8400-e29b-41d4-a716-446655440000"
      Y el email queda como "admin@sem7.com"
      Y persiste la sesión en almacenamiento local bajo la clave "sem7_admin_session"
      Y redirige al panel de eventos del administrador (/admin/events)

  @smoke @critico @happy-path @CRITERIO-1.2
  Escenario: Sesión persistida al recargar la página
    Dado que el administrador tiene una sesión válida guardada en almacenamiento local
      Y la sesión contiene role "ADMIN", userId "550e8400-e29b-41d4-a716-446655440000" y email "admin@sem7.com"
    Cuando recarga la página en /admin/events
    Entonces el contexto de autenticación recupera los datos de sesión desde almacenamiento local
      Y el administrador permanece autenticado (isAuthenticated = true)
      Y puede acceder al panel de eventos sin ser redirigido al login

  @smoke @critico @happy-path @CRITERIO-1.2
  Escenario: Navegación directa a ruta protegida con sesión activa
    Dado que el administrador tiene sesión válida en almacenamiento local
    Cuando navega directamente a /admin/events (sin pasar por el login)
    Entonces accede al panel sin redirección al login

  # =========================================================
  # ERROR PATHS
  # =========================================================

  @error-path @CRITERIO-1.3
  Escenario: Login con contraseña incorrecta
    Dado que el administrador está en la página de login
      Y no existe sesión activa
    Cuando ingresa el email "admin@sem7.com" y la contraseña "clave_incorrecta"
      Y presiona "Iniciar Sesión"
    Entonces el sistema muestra el mensaje "Credenciales inválidas" en el formulario
      Y no redirige al panel de administración
      Y no se escribe ninguna sesión en almacenamiento local

  @error-path @CRITERIO-1.3
  Escenario: Login con email incorrecto
    Dado que el administrador está en la página de login
    Cuando ingresa el email "otro@email.com" y la contraseña "admin123"
      Y presiona "Iniciar Sesión"
    Entonces el sistema muestra el mensaje "Credenciales inválidas"
      Y no se redirige ni se almacena ninguna sesión

  @error-path @seguridad @CRITERIO-1.4
  Escenario: Acceso directo a ruta protegida sin sesión activa
    Dado que no existe sesión de administrador en almacenamiento local
    Cuando un visitante intenta acceder directamente a /admin/events
    Entonces el guardia de rutas redirige a /admin/login
      Y el contenido protegido del panel no se renderiza

  @error-path @CRITERIO-1.4
  Escenario: Acceso directo a ruta admin raíz sin sesión activa
    Dado que no existe sesión de administrador en almacenamiento local
    Cuando un visitante intenta acceder a /admin
    Entonces es redirigido a /admin/login

  # =========================================================
  # LOGOUT
  # =========================================================

  @smoke @critico @CRITERIO-1.5
  Escenario: Cierre de sesión desde el panel de administración
    Dado que el administrador tiene sesión activa en el sistema
      Y se encuentra en el panel en /admin/events
    Cuando hace clic en el botón "Cerrar Sesión" del navbar de administración
    Entonces la clave "sem7_admin_session" es eliminada del almacenamiento local
      Y el estado de autenticación se resetea (isAuthenticated = false)
      Y es redirigido a /admin/login

  # =========================================================
  # EDGE CASES
  # =========================================================

  @edge-case @seguridad @CRITERIO-1.6
  Escenario: Almacenamiento local con JSON corrupto
    Dado que existe un valor inválido en almacenamiento local bajo "sem7_admin_session"
      Y el valor es JSON malformado (ej. "corrupted-json{{{")
    Cuando el proveedor de autenticación intenta restaurar la sesión al inicializar
    Entonces limpia el valor corrupto del almacenamiento local
      Y establece isAuthenticated en false
      Y las rutas protegidas /admin/* redirigen a /admin/login

  @edge-case @seguridad @CRITERIO-1.6
  Esquema del escenario: Almacenamiento local con role manipulado
    Dado que existe una sesión en almacenamiento local con role "<role_manipulado>"
    Cuando el proveedor de autenticación intenta restaurar la sesión al inicializar
    Entonces limpia el valor del almacenamiento local
      Y establece isAuthenticated en false
      Y redirige a /admin/login al intentar acceder a rutas protegidas
    Ejemplos:
      | role_manipulado |
      | USER            |
      | BUYER           |
      | ""              |
      | null            |

  @edge-case @CRITERIO-1.7
  Escenario: Rutas públicas del comprador funcionan normalmente sin sesión de admin
    Dado que no existe sesión de administrador en almacenamiento local
    Cuando un comprador navega a /eventos
    Entonces la página de cartelera se muestra correctamente
      Y no ocurre ninguna redirección al login de administrador

  @edge-case @CRITERIO-1.7
  Escenario: Rutas públicas del comprador funcionan normalmente con sesión de admin activa
    Dado que el administrador tiene sesión activa
    Cuando accede a /eventos o /eventos/:id como visitante del sitio público
    Entonces las rutas públicas funcionan con normalidad
      Y el proveedor de autenticación no interfiere con la experiencia del comprador

  @edge-case @CRITERIO-1.1
  Escenario: Login no hace doble submit al presionar Enter
    Dado que el administrador está completando el formulario de login
    Cuando presiona la tecla Enter en el campo de contraseña
    Entonces el formulario se envía una sola vez
      Y no se produce duplicación de la llamada a login

  @edge-case
  Escenario: Acceso al login cuando ya está autenticado
    Dado que el administrador tiene una sesión activa
    Cuando intenta acceder a /admin/login (ej. navegando hacia atrás)
    Entonces es redirigido automáticamente a /admin/events
      Y no ve el formulario de login nuevamente
```

---

## Resumen de cobertura Gherkin

| Criterio     | Tipo         | Escenarios generados | Tags                     |
|--------------|--------------|----------------------|--------------------------|
| CRITERIO-1.1 | Happy path   | 2                    | `@smoke @critico`        |
| CRITERIO-1.2 | Happy path   | 2                    | `@smoke @critico`        |
| CRITERIO-1.3 | Error path   | 2                    | `@error-path`            |
| CRITERIO-1.4 | Error path   | 2                    | `@error-path @seguridad` |
| CRITERIO-1.5 | Happy path   | 1                    | `@smoke @critico`        |
| CRITERIO-1.6 | Edge case    | 2 (+ 4 ejemplos)     | `@edge-case @seguridad`  |
| CRITERIO-1.7 | Edge case    | 2                    | `@edge-case`             |
| Extra        | Edge case    | 2                    | `@edge-case`             |

**Total escenarios:** 15 escenarios básicos + 4 ejemplos de esquema = **19 casos de prueba**
