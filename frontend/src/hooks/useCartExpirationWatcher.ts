import { useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNotifications } from '../contexts/NotificationsContext';

const CHECK_INTERVAL_MS = 30_000;
const EXPIRATION_WARNING_MS = 2 * 60 * 1000;

function parseUTC(dateStr: string): number {
  return new Date(dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z').getTime();
}

export function useCartExpirationWatcher(): void {
  const { items, updateItem } = useCart();
  const { addNotification } = useNotifications();
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    function check() {
      const now = Date.now();
      for (const item of itemsRef.current) {
        const remaining = parseUTC(item.validUntilAt) - now;

        if (remaining <= 0 && !item.expired) {
          updateItem(item.id, { expired: true });
          addNotification(
            'timer_expired',
            `${item.eventTitle} — ${item.tierType}`,
            item.reservationId,
            item.eventId,
          );
        } else if (
          remaining > 0 &&
          remaining < EXPIRATION_WARNING_MS &&
          !item.expirationAlerted &&
          !item.expired
        ) {
          updateItem(item.id, { expirationAlerted: true });
          addNotification(
            'timer_expired',
            `${item.eventTitle} — ${item.tierType} expira en menos de 2 minutos`,
            item.reservationId,
            item.eventId,
          );
        }
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [updateItem, addNotification]);
}
