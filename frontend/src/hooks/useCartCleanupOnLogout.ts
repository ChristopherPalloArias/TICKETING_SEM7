import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useCart } from '../contexts/CartContext';

/**
 * Hook que automáticamente limpia el carrito cuando el usuario hace logout
 * Ejecutar en App.tsx o en componente raíz
 *
 * Uso:
 * ```tsx
 * function App() {
 *   useCartCleanupOnLogout();
 *   return <YourApp />;
 * }
 * ```
 */
export function useCartCleanupOnLogout(): void {
  const { email } = useAuth();
  const { clearCart } = useCart();
  const prevEmailRef = useRef<string | null>(email ?? null);

  useEffect(() => {
    const prevEmail = prevEmailRef.current;

    // Si email pasó de algo a null/undefined → logout detectado
    if (prevEmail && !email) {
      console.log('🚪 Logout detectado — limpiando carrito...');
      clearCart();
    }

    prevEmailRef.current = email ?? null;
  }, [email, clearCart]);
}
