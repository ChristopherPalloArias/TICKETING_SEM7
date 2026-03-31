import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, CartContextValue } from '../types/cart.types';
import {
  getCartItems,
  saveCartItems,
  addCartItem as addCartItemStorage,
  removeCartItem as removeCartItemStorage,
  updateCartItem as updateCartItemStorage,
  clearCart as clearCartStorage,
} from '../services/cartService';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => getCartItems());

  useEffect(() => {
    saveCartItems(items);
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    const result = addCartItemStorage(item);
    if (result.success) {
      setItems(getCartItems());
    }
  }, []);

  const removeItem = useCallback((itemId: string) => {
    const updated = removeCartItemStorage(itemId);
    setItems(updated);
  }, []);

  const updateItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    const updated = updateCartItemStorage(itemId, updates);
    setItems(updated);
  }, []);

  const clearCart = useCallback(() => {
    clearCartStorage();
    setItems([]);
  }, []);

  const activeItemCount = useMemo(
    () => items.filter((i) => !i.expired).length,
    [items],
  );

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
