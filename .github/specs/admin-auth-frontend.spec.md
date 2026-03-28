---
id: SPEC-014
status: DRAFT
feature: admin-auth-frontend
created: 2026-03-27
updated: 2026-03-27
author: spec-generator
version: "1.0"
related-specs: [SPEC-008]
---

# Spec: Login de Administrador y Protección de Rutas (Frontend)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Autenticación simulada para el panel de administración del sistema de ticketing SEM7. Incluye contexto de auth (React Context), página de login, guard de rutas protegidas `/admin/*`, navbar diferenciado y persistencia de sesión en localStorage. En esta iteración la autenticación es simulada contra credenciales hardcodeadas; las llamadas al backend admin usan headers `X-Role` y `X-User-Id` (sin Bearer token).

### Requerimiento de Negocio
Fuente: `.github/requirements/integracion-admin-frontend.md` — **HU-ADM-01: Login de administrador y protección de rutas (3 SP)**.

El administrador necesita acceder a un panel de gestión de eventos protegido por credenciales. En esta iteración MVP se implementa auth simulada en el frontend con credenciales de demo hardcodeadas. El backend ya acepta headers `X-Role: ADMIN` y `X-User-Id` para autorización.

### Historias de Usuario

#### HU-ADM-01: Login de administrador y protección de rutas

```
Como:        Administrador
Quiero:      Ingresar al panel de administración con mis credenciales
Para:        Acceder a las funcionalidades de gestión de eventos de forma segura

Prioridad:   Alta
Estimación:  S (3 SP)
Dependencias: Ninguna (auth simulada — no depende de backend)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-ADM-01

**Happy Path**
```gherkin
CRITERIO-1.1: Login exitoso con credenciales de demo
  Dado que:  El administrador está en la página /admin/login
  Cuando:    Ingresa email "admin@sem7.com" y password "admin123" y envía el formulario
  Entonces:  El sistema establece sesión con role=ADMIN, userId="550e8400-e29b-41d4-a716-446655440000", email="admin@sem7.com"
             Y persiste la sesión en localStorage con key "sem7_admin_session"
             Y redirige a /admin/events
```

```gherkin
CRITERIO-1.2: Sesión persistida al recargar
  Dado que:  El administrador tiene sesión activa guardada en localStorage
  Cuando:    Recarga la página o navega directamente a /admin/events
  Entonces:  El AuthContext recupera la sesión desde localStorage
             Y el administrador permanece autenticado
             Y puede acceder a las rutas /admin/* sin re-login
```

**Error Path**
```gherkin
CRITERIO-1.3: Login con credenciales inválidas
  Dado que:  El administrador está en /admin/login
  Cuando:    Ingresa credenciales que no coinciden con las de demo
  Entonces:  Se muestra el mensaje "Credenciales inválidas" en el formulario
             Y no se redirige al dashboard
             Y no se escribe nada en localStorage
```

```gherkin
CRITERIO-1.4: Acceso directo a ruta protegida sin sesión
  Dado que:  No existe sesión activa de administrador en localStorage
  Cuando:    Un usuario intenta acceder a /admin/events directamente
  Entonces:  El AdminGuard redirige a /admin/login
```

**Logout**
```gherkin
CRITERIO-1.5: Cierre de sesión
  Dado que:  El administrador tiene sesión activa
  Cuando:    Hace clic en "Cerrar Sesión" en el AdminNavBar
  Entonces:  Se elimina "sem7_admin_session" de localStorage
             Y el estado del AuthContext se resetea (isAuthenticated=false)
             Y se redirige a /admin/login
```

**Edge Case**
```gherkin
CRITERIO-1.6: localStorage corrupto o manipulado
  Dado que:  El valor de "sem7_admin_session" en localStorage es JSON inválido o tiene role distinto de ADMIN
  Cuando:    El AuthProvider intenta restaurar la sesión al montar
  Entonces:  Limpia el valor corrupto de localStorage
             Y establece isAuthenticated=false
             Y las rutas /admin/* redirigen a /admin/login
```

```gherkin
CRITERIO-1.7: Rutas públicas no afectadas por auth de admin
  Dado que:  No existe sesión de administrador
  Cuando:    Un comprador navega a /eventos o /eventos/:id
  Entonces:  Las rutas públicas funcionan normalmente sin redirección
             Y el AuthProvider no interfiere con la experiencia del comprador
```

### Reglas de Negocio
1. **Credenciales de demo hardcodeadas**: email=`admin@sem7.com`, password=`admin123`. No se llama a ningún endpoint de autenticación.
2. **userId fijo de demo**: `550e8400-e29b-41d4-a716-446655440000` (UUID determinístico para consistencia).
3. **Persistencia en localStorage**: key `sem7_admin_session`, valor JSON con `{ role, userId, email }`.
4. **Headers de autorización**: las peticiones admin al backend usan `X-Role: ADMIN` y `X-User-Id: <userId>` (NO Bearer token).
5. **Rutas públicas intactas**: el AuthProvider envuelve toda la app pero NO afecta las rutas del comprador (`/eventos`, `/eventos/:id`).
6. **Diseño Teatro Noir**: el login y el navbar admin siguen el design system existente (dark surfaces, `--color-primary: #FF6B47`, uppercase serif headings).

---

## 2. DISEÑO

### Modelos de Datos

> **No hay cambios de backend ni de base de datos.** Esta spec es frontend-only.

#### Interfaces TypeScript

**`types/auth.types.ts`** (archivo nuevo)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `role` | `'ADMIN'` | sí | Rol del usuario autenticado |
| `userId` | `string` | sí | UUID del administrador |
| `email` | `string` | sí | Email del administrador |

```typescript
// types/auth.types.ts

export type AdminRole = 'ADMIN';

export interface AdminSession {
  role: AdminRole;
  userId: string;
  email: string;
}

export interface AuthContextValue {
  role: AdminRole | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}
```

### API Endpoints

> No se crean ni modifican endpoints. Las peticiones admin existentes ya usan headers `X-Role` + `X-User-Id`.

### Diseño Frontend

#### Contexto de Autenticación

**`contexts/AuthContext.tsx`** (archivo nuevo)

| Export | Tipo | Descripción |
|--------|------|-------------|
| `AuthProvider` | `React.FC<{ children: ReactNode }>` | Provider que envuelve `<App />` o el árbol de rutas |
| `useAuth` | `() => AuthContextValue` | Hook para consumir el contexto de auth |

**Comportamiento del `AuthProvider`:**
- Al montar: lee `localStorage.getItem('sem7_admin_session')`, parsea JSON. Si es válido (`role === 'ADMIN'`, `userId` y `email` presentes), restaura la sesión. Si es inválido, limpia localStorage.
- `login(email, password)`: valida contra credenciales hardcodeadas. Si coincide, establece estado y persiste en localStorage. Retorna `true`. Si no coincide, retorna `false`.
- `logout()`: limpia `localStorage.removeItem('sem7_admin_session')` y resetea estado.

**Credenciales hardcodeadas (constantes privadas del módulo):**
```typescript
const DEMO_EMAIL = 'admin@sem7.com';
const DEMO_PASSWORD = 'admin123';
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
```

#### Componentes nuevos

| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| `AdminGuard` | `components/admin/AdminGuard/AdminGuard.tsx` | ninguna | Wrapper de rutas protegidas. Si `!isAuthenticated` → `<Navigate to="/admin/login" />`. Si autenticado → `<Outlet />` |
| `AdminNavBar` | `components/admin/AdminNavBar/AdminNavBar.tsx` | ninguna | Navbar del panel admin con logo, email y botón logout |

**`AdminGuard`** — detalle:
```typescript
// components/admin/AdminGuard/AdminGuard.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
// Si !isAuthenticated → <Navigate to="/admin/login" replace />
// Si isAuthenticated → <Outlet />
```
- No tiene archivo CSS Module propio (es puro lógica).

**`AdminNavBar`** — detalle:

| Elemento | Contenido | Estilo |
|----------|-----------|--------|
| Logo | Texto "SEM7" + sufijo "Admin" | `--color-primary` para SEM7, `--color-on-surface-variant` para "Admin" |
| Email | `{email}` del `useAuth()` | `--color-on-surface-variant`, font-size small |
| Botón logout | Texto "Cerrar Sesión" o icono `LogOut` de lucide-react | Borde outline, hover con `--color-primary` |
| Fondo | `--color-surface-highest` (#323232) | Distinto al NavBar del comprador (`--color-surface-lowest`) |

**Archivo CSS Module:** `components/admin/AdminNavBar/AdminNavBar.module.css`

#### Páginas nuevas

| Página | Archivo | Ruta | Protegida |
|--------|---------|------|-----------|
| `LoginPage` | `pages/admin/LoginPage/LoginPage.tsx` | `/admin/login` | No |
| `EventsDashboard` | `pages/admin/EventsDashboard/EventsDashboard.tsx` | `/admin/events` | Sí |

**`LoginPage`** — detalle:

| Elemento | Contenido | Estilo |
|----------|-----------|--------|
| Container | Centrado vertical y horizontalmente, max-width 400px | `--color-surface-low` fondo del card, `--color-surface-lowest` fondo de la página |
| Logo | Texto "SEM7" + sufijo "Admin" | `--color-primary` + `--color-on-surface-variant`, uppercase, serif |
| Input email | `type="email"`, placeholder "Email" | Dark input, border `--color-outline-variant`, focus `--color-primary` |
| Input password | `type="password"`, placeholder "Contraseña" | Igual que email |
| Botón submit | "Iniciar Sesión" | Fondo `--color-primary`, texto `--color-on-primary`, uppercase |
| Error | "Credenciales inválidas" | `color: #ef4444` (rojo), debajo del formulario, solo visible tras intento fallido |

**Archivo CSS Module:** `pages/admin/LoginPage/LoginPage.module.css`

**Comportamiento:**
1. Si `isAuthenticated` ya es `true` al montar → `<Navigate to="/admin/events" replace />` (evita re-login).
2. `onSubmit`: llama `login(email, password)`. Si retorna `false`, muestra error. Si `true`, `navigate('/admin/events')`.

**`EventsDashboard`** (placeholder para esta spec):
```typescript
// pages/admin/EventsDashboard/EventsDashboard.tsx
// Placeholder — implementación completa en SPEC para HU-ADM-02
export default function EventsDashboard() {
  return <div>Dashboard de Eventos (próximamente)</div>;
}
```

**Archivo CSS Module:** `pages/admin/EventsDashboard/EventsDashboard.module.css`

#### Hooks y State

| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useAuth` | `contexts/AuthContext.tsx` | `AuthContextValue` | Estado de autenticación, login y logout |

> No se necesitan hooks adicionales para esta HU. El estado se maneja directamente en el contexto.

#### Services (llamadas API)

> No se crean servicios para esta HU. La autenticación es simulada sin llamadas al backend.
> Los headers `X-Role` y `X-User-Id` se agregarán a los servicios admin en HUs posteriores (HU-ADM-02+).

### Arquitectura y Dependencias

**Paquetes nuevos requeridos:** Ninguno. Todas las dependencias necesarias ya están instaladas (react, react-router-dom, lucide-react).

**Impacto en `main.tsx`:**
- Envolver `<App />` con `<AuthProvider>` para que el contexto esté disponible en toda la app.

```typescript
// main.tsx — cambio requerido
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```

**Impacto en `App.tsx` — árbol de rutas DESPUÉS del cambio:**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CarteleraPage from './pages/CarteleraPage/CarteleraPage';
import EventDetail from './pages/EventDetail/EventDetail';
import LoginPage from './pages/admin/LoginPage/LoginPage';
import AdminGuard from './components/admin/AdminGuard/AdminGuard';
import AdminNavBar from './components/admin/AdminNavBar/AdminNavBar';
import EventsDashboard from './pages/admin/EventsDashboard/EventsDashboard';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas del comprador */}
        <Route path="/eventos" element={<CarteleraPage />} />
        <Route path="/eventos/:id" element={<EventDetail />} />
        <Route path="/" element={<Navigate to="/eventos" replace />} />

        {/* Rutas admin — login público */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Rutas admin — protegidas */}
        <Route path="/admin" element={<AdminGuard />}>
          <Route path="events" element={
            <>
              <AdminNavBar />
              <EventsDashboard />
            </>
          } />
          {/* Futuras rutas admin: /admin/events/new, /admin/events/:id */}
          <Route index element={<Navigate to="events" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**Estructura de archivos nuevos:**

```
frontend/src/
  contexts/
    AuthContext.tsx              ← AuthProvider + useAuth hook
  types/
    auth.types.ts               ← AdminSession, AuthContextValue interfaces
  components/
    admin/
      AdminGuard/
        AdminGuard.tsx           ← Route guard (lógica pura, sin CSS)
      AdminNavBar/
        AdminNavBar.tsx          ← Navbar del panel admin
        AdminNavBar.module.css   ← Estilos del navbar admin
  pages/
    admin/
      LoginPage/
        LoginPage.tsx            ← Página de login
        LoginPage.module.css     ← Estilos de la página de login
      EventsDashboard/
        EventsDashboard.tsx      ← Placeholder dashboard
        EventsDashboard.module.css ← Estilos mínimos del placeholder
```

### Notas de Implementación
1. **Auth simulada — decisión consciente:** esta iteración no llama a ningún endpoint de autenticación. El login valida contra constantes en el módulo. Esto se documentará como deuda técnica para reemplazar con auth real en una iteración futura.
2. **Separación comprador/admin:** el `AuthProvider` envuelve toda la app pero no interfiere con rutas `/eventos`. El `AdminGuard` solo se aplica bajo `/admin`.
3. **AdminNavBar dentro de las rutas:** el `AdminNavBar` se renderiza solo dentro de las rutas protegidas, no en el login ni en las rutas del comprador. Se coloca como sibling del contenido de cada ruta admin protegida (no como layout route para dar flexibilidad).
4. **CSS Modules obligatorio:** cada componente visual nuevo tiene su propio `*.module.css`. No se usan clases globales ni Tailwind.
5. **Tokens de diseño:** los componentes deben usar variables CSS de `styles/tokens.module.css` (`:root` vars: `--color-primary`, `--color-surface-*`, `--color-on-surface-*`, `--color-outline-variant`).
6. **No se modifica el NavBar existente** del comprador. El AdminNavBar es un componente completamente separado.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

> No hay tareas de backend para esta spec. Feature es frontend-only.

### Frontend

#### Implementación
- [ ] Crear `types/auth.types.ts` con interfaces `AdminSession`, `AuthContextValue` y tipo `AdminRole`
- [ ] Crear `contexts/AuthContext.tsx` con `AuthProvider` y `useAuth()` hook
  - [ ] Estado: `role`, `userId`, `email`, `isAuthenticated`
  - [ ] `login(email, password)`: valida contra credenciales hardcodeadas, persiste en localStorage, retorna boolean
  - [ ] `logout()`: limpia localStorage y resetea estado
  - [ ] Al montar: restaura sesión desde localStorage (con validación de JSON y campos)
  - [ ] Manejo de localStorage corrupto: limpiar y establecer isAuthenticated=false
- [ ] Crear `components/admin/AdminGuard/AdminGuard.tsx`
  - [ ] Si `!isAuthenticated` → `<Navigate to="/admin/login" replace />`
  - [ ] Si `isAuthenticated` → `<Outlet />`
- [ ] Crear `components/admin/AdminNavBar/AdminNavBar.tsx` + `AdminNavBar.module.css`
  - [ ] Logo "SEM7" + sufijo "Admin"
  - [ ] Mostrar email del administrador desde `useAuth()`
  - [ ] Botón "Cerrar Sesión" que llama `logout()` y navega a `/admin/login`
  - [ ] Fondo `--color-surface-highest`
- [ ] Crear `pages/admin/LoginPage/LoginPage.tsx` + `LoginPage.module.css`
  - [ ] Formulario con input email + input password + botón "Iniciar Sesión"
  - [ ] Diseño centrado, tema Teatro Noir, logo "SEM7 Admin"
  - [ ] Mensaje de error "Credenciales inválidas" tras intento fallido
  - [ ] Redirección a `/admin/events` tras login exitoso
  - [ ] Si ya autenticado al montar → `<Navigate to="/admin/events" replace />`
- [ ] Crear `pages/admin/EventsDashboard/EventsDashboard.tsx` + `EventsDashboard.module.css` (placeholder)
- [ ] Modificar `main.tsx` — envolver `<App />` con `<AuthProvider>`
- [ ] Modificar `App.tsx` — registrar rutas:
  - [ ] `/admin/login` → `<LoginPage />` (público)
  - [ ] `/admin` → `<AdminGuard />` (layout route protegida)
  - [ ] `/admin/events` → `<AdminNavBar />` + `<EventsDashboard />`
  - [ ] `/admin` index → redirect a `/admin/events`

#### Tests Frontend
- [ ] `[AuthContext] login con credenciales válidas establece sesión y retorna true`
- [ ] `[AuthContext] login con credenciales inválidas retorna false y no cambia estado`
- [ ] `[AuthContext] logout limpia localStorage y resetea isAuthenticated`
- [ ] `[AuthContext] restaura sesión válida desde localStorage al montar`
- [ ] `[AuthContext] limpia localStorage corrupto al montar`
- [ ] `[LoginPage] renderiza formulario con inputs email y password`
- [ ] `[LoginPage] muestra "Credenciales inválidas" tras login fallido`
- [ ] `[LoginPage] redirige a /admin/events tras login exitoso`
- [ ] `[LoginPage] redirige a /admin/events si ya autenticado`
- [ ] `[AdminGuard] redirige a /admin/login si no autenticado`
- [ ] `[AdminGuard] renderiza Outlet si autenticado`
- [ ] `[AdminNavBar] muestra email del admin y botón cerrar sesión`
- [ ] `[AdminNavBar] llama logout al hacer clic en cerrar sesión`

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CRITERIO-1.1 a CRITERIO-1.7
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Verificar login exitoso con credenciales de demo (admin@sem7.com / admin123)
- [ ] Verificar rechazo con credenciales inválidas (mensaje visible)
- [ ] Verificar redirección a /admin/login al acceder a /admin/events sin sesión
- [ ] Verificar persistencia de sesión al recargar la página (F5)
- [ ] Verificar cierre de sesión elimina datos de localStorage y redirige
- [ ] Verificar que las rutas de comprador (/eventos, /eventos/:id) siguen funcionando sin sesión de admin
- [ ] Verificar que localStorage corrupto no rompe la app (se limpia silenciosamente)
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar que todas las reglas de negocio están cubiertas
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
