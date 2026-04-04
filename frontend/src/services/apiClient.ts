import axios from 'axios';

const TOKEN_KEY = 'jwt_token';
const ROLE_KEY = 'user_role';
const GUEST_ID_KEY = 'guest_id';
const USER_ID_KEY = 'user_id';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Helper: Generate or retrieve guest ID
const getOrCreateGuestId = (): string => {
  let guestId = sessionStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    sessionStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Send X-Role header (authenticated user or empty for guest)
  const role = sessionStorage.getItem(ROLE_KEY);
  if (role) {
    config.headers['X-Role'] = role;
  }

  // Always send X-User-Id header (authenticated user or guest)
  const userId = sessionStorage.getItem(USER_ID_KEY);
  const buyerId = userId || getOrCreateGuestId();
  config.headers['X-User-Id'] = buyerId;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      const role = sessionStorage.getItem(ROLE_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ROLE_KEY);
      sessionStorage.removeItem('user_id');
      sessionStorage.removeItem('user_email');
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message: 'Tu sesión ha expirado', type: 'error', id: Date.now() },
        }),
      );
      const redirectPath = role === 'ADMIN' ? '/admin/login' : '/login';
      window.location.replace(redirectPath);
    } else if (status === 403) {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message: 'No tienes permisos para esta acción', type: 'error', id: Date.now() },
        }),
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;
