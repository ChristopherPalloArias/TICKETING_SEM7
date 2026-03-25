---
applyTo: "api-gateway/**,frontend/**"
---

> **Scope**: Se aplica solo si el repositorio contiene capa frontend (web o BFF con vistas). En un proyecto backend-only, puede ignorarse.

# Instrucciones para Archivos de Frontend

## Convenciones Obligatorias

- **CSS**: SIEMPRE usar CSS Modules (`*.module.css`) — NUNCA clases CSS globales ni frameworks como Tailwind/Bootstrap.
- **Nombres**: PascalCase para componentes y páginas (`.jsx`), camelCase para hooks (`.js`) y servicios (`.js`).
- **Auth state**: SIEMPRE usar una única fuente de verdad (context/store centralizado).
- **Env vars**: usar la convención del frontend activo (si existe Vite, prefijo `VITE_`).

## Estructura de Archivos

```
src/
  hooks/                  ← estado compartido y lógica UI
  services/               ← clientes HTTP al api-gateway
  components/             ← componentes reutilizables
  pages/                  ← vistas/páginas
```

## Llamadas a la API Backend

Usar un cliente HTTP consistente del proyecto (Axios o Fetch wrapper). Las llamadas van en `services/`, nunca directamente en componentes o páginas.

```js
// services/featureService.js
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL;

export async function getFeatures(token) {
  const res = await axios.get(`${API_BASE}/api/v1/features`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function createFeature(data, token) {
  const res = await axios.post(`${API_BASE}/api/v1/features`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
```

El token se obtiene siempre desde `useAuth()`:
```js
const { token } = useAuth();
```

## Rutas

Las rutas se registran en el entrypoint de rutas del frontend:
```jsx
<Route path="/nueva-ruta" element={<ProtectedRoute><NuevaPagina /></ProtectedRoute>} />
```

## Componentes

- Un componente por archivo.
- Props tipadas con JSDoc si son complejas.
- No lógica de negocio en los componentes — delegar a hooks o servicios.
