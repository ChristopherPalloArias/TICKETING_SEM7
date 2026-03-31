import type { CartItem } from '../types/cart.types';

const STORAGE_KEY = 'sem7_shopping_cart';
const MAX_ITEMS = 5;

export function getCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

export function addCartItem(item: CartItem): { success: boolean; error?: string } {
  const items = getCartItems();

  if (items.length >= MAX_ITEMS) {
    return { success: false, error: 'Máximo 5 reservas simultáneas permitidas' };
  }

  const duplicate = items.find(
    (i) => i.eventId === item.eventId && i.tierId === item.tierId,
  );
  if (duplicate) {
    return { success: false, error: 'Ya tienes este tier en tu carrito' };
  }

  items.push(item);
  saveCartItems(items);
  return { success: true };
}

export function removeCartItem(itemId: string): CartItem[] {
  const items = getCartItems().filter((i) => i.id !== itemId);
  saveCartItems(items);
  return items;
}

export function updateCartItem(itemId: string, updates: Partial<CartItem>): CartItem[] {
  const items = getCartItems().map((i) =>
    i.id === itemId ? { ...i, ...updates } : i,
  );
  saveCartItems(items);
  return items;
}

export function clearCart(): void {
  localStorage.removeItem(STORAGE_KEY);
}
