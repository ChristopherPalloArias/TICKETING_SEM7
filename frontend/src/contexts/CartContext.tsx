import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, CartContextValue } from '../types/cart.types';
import {
  getCartItems,
  saveCartItems,
  addCartItem as addCartItemStorage,
  removeCartItem as removeCartItemStorage,
  updateCartItem as updateCartItemStorage,
  clearCart as clearCartStorage,
  migrateOldCartData,
} from '../services/cartService';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { email } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    // Migrar datos legacy en primer load
    migrateOldCartData(email);
    return getCartItems(email);
  });

  const prevEmailRef = useRef<string | null>(null);

  // ✅ DETECCIÓN DE CAMBIO DE USUARIO
  useEffect(() => {
    const prevEmail = prevEmailRef.current;

    if (prevEmail && prevEmail !== email) {
      // Usuario cambió (login/logout)
      console.log(`🔄 Cambio de usuario detectado: ${prevEmail} → ${email ?? 'anónimo'}`);
      clearCartStorage(prevEmail); // Limpiar carrito viejo
      setItems(getCartItems(email)); // Cargar carrito nuevo
    }

    prevEmailRef.current = email;
  }, [email]);

  // ✅ PERSISTENCIA: sincronizar cambios de items a localStorage
  useEffect(() => {
    saveCartItems(items, email);
  }, [items, email]);

  const addItem = useCallback(
    (item: CartItem) => {
      const result = addCartItemStorage(item, email);
      if (result.success) {
        setItems(getCartItems(email));
      }
    },
    [email],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      const updated = removeCartItemStorage(itemId, email);
      setItems(updated);
    },
    [email],
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<CartItem>) => {
      const updated = updateCartItemStorage(itemId, updates, email);
      setItems(updated);
    },
    [email],
  );

  const clearCart = useCallback(() => {
    clearCartStorage(email);
    setItems([]);
  }, [email]);

  const activeItemCount = useMemo(() => items.filter((i) => !i.expired).length, [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, addItem, removeItem, updateItem, clearCart, activeItemCount }),
    [items, addItem, removeItem, updateItem, clearCart, activeItemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
