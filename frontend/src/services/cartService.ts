import type { CartItem } from '../types/cart.types';

const STORAGE_KEY_PREFIX = 'sem7_shopping_cart';
const MAX_ITEMS = 5;

/**
 * Genera clave de almacenamiento segmentada por usuario
 * @param email Email del usuario (null = carrito anónimo)
 * @returns Clave encodificada para localStorage
 */
export function getCartStorageKey(email?: string | null): string {
  if (!email) {
    return `${STORAGE_KEY_PREFIX}_anonymous`;
  }
  // Encodificar email para evitar caracteres especiales en claves
  const encoded = btoa(email).replace(/[^a-zA-Z0-9]/g, '_');
  return `${STORAGE_KEY_PREFIX}_${encoded}`;
}

/**
 * Obtiene carrito del usuario actual
 */
export function getCartItems(email?: string | null): CartItem[] {
  try {
    const key = getCartStorageKey(email);
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda carrito del usuario actual
 */
export function saveCartItems(items: CartItem[], email?: string | null): void {
  try {
    const key = getCartStorageKey(email);
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Si localStorage lleno, intenta reducir items
    const trimmed = items.slice(0, MAX_ITEMS);
    const key = getCartStorageKey(email);
    localStorage.setItem(key, JSON.stringify(trimmed));
  }
}

/**
 * Agregar item al carrito (con validaciones)
 */
export function addCartItem(
  item: CartItem,
  email?: string | null,
): { success: boolean; error?: string } {
  // VALIDACIÓN: No agregar sin usuario identificado (seguridad)
  if (!email) {
    // Permitir carrito anónimo pero con warning
    console.warn('⚠️ Adding to anonymous cart — no user context');
  }

  const items = getCartItems(email);

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
  saveCartItems(items, email);
  return { success: true };
}

/**
 * Eliminar item del carrito
 */
export function removeCartItem(itemId: string, email?: string | null): CartItem[] {
  const items = getCartItems(email).filter((i) => i.id !== itemId);
  saveCartItems(items, email);
  return items;
}

/**
 * Actualizar item del carrito
 */
export function updateCartItem(
  itemId: string,
  updates: Partial<CartItem>,
  email?: string | null,
): CartItem[] {
  const items = getCartItems(email).map((i) =>
    i.id === itemId ? { ...i, ...updates } : i,
  );
  saveCartItems(items, email);
  return items;
}

/**
 * Limpia carrito del usuario actual
 */
export function clearCart(email?: string | null): void {
  const key = getCartStorageKey(email);
  localStorage.removeItem(key);
}

/**
 * MIGRACIÓN: Limpia datos legacy (claves antiguas sin segmentar)
 * Ejecutar una sola vez al startup
 */
export function migrateOldCartData(currentEmail?: string | null): void {
  const oldKey = 'sem7_shopping_cart';
  const oldData = localStorage.getItem(oldKey);

  if (!oldData) return; // Nada que migrar

  try {
    const parsed = JSON.parse(oldData) as CartItem[];

    if (currentEmail && parsed.length > 0) {
      // Migrar datos a nueva clave
      const newKey = getCartStorageKey(currentEmail);
      const existing = localStorage.getItem(newKey);

      if (!existing) {
        // Solo migrar si no existen datos nuevos
        localStorage.setItem(newKey, oldData);
        console.log('✅ Carrito migrado de clave legacy a segmentada');
      }
    }

    // Limpiar clave antigua
    localStorage.removeItem(oldKey);
  } catch {
    // Si hay parse error, simplemente limpiar
    localStorage.removeItem(oldKey);
  }
}
