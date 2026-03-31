import { useEffect, useState } from 'react';
import { Clock, Trash2, CreditCard, RefreshCw } from 'lucide-react';
import type { CartItem } from '../../types/cart.types';
import styles from './CartItemCard.module.css';

interface CartItemCardProps {
  item: CartItem;
  onPay: (item: CartItem) => void;
  onRemove: (itemId: string) => void;
  onRenew: (item: CartItem) => void;
}

const MAX_TIMER_MS = 10 * 60 * 1000;

function parseUTC(dateStr: string): number {
  return new Date(dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z').getTime();
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const clamped = Math.min(ms, MAX_TIMER_MS);
  const totalSec = Math.floor(clamped / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

export default function CartItemCard({ item, onPay, onRemove, onRenew }: CartItemCardProps) {
  const [remaining, setRemaining] = useState(() => parseUTC(item.validUntilAt) - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(parseUTC(item.validUntilAt) - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [item.validUntilAt]);

  const isExpired = item.expired || remaining <= 0;
  const subtotal = item.tierPrice * item.quantity;

  const handleRemove = () => {
    if (window.confirm(`¿Eliminar "${item.eventTitle} — ${item.tierType}" del carrito?`)) {
      onRemove(item.id);
    }
  };

  return (
    <div className={`${styles.card} ${isExpired ? styles.expired : ''}`}>
      <div className={styles.imageWrap}>
        {item.eventImageUrl ? (
          <img src={item.eventImageUrl} alt={item.eventTitle} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
        {isExpired && <span className={styles.expiredBadge}>Expirado</span>}
      </div>

      <div className={styles.info}>
        <h3 className={styles.title}>{item.eventTitle}</h3>
        <p className={styles.meta}>{item.eventDate} · {item.eventRoom}</p>
        <p className={styles.tier}>
          {item.tierType} × {item.quantity} — {formatCurrency(item.tierPrice)} c/u
        </p>
        <p className={styles.subtotal}>Subtotal: {formatCurrency(subtotal)}</p>

        <div className={styles.countdown}>
          <Clock size={14} />
          <span className={isExpired ? styles.countdownExpired : ''}>
            {isExpired ? 'Expirado' : formatCountdown(remaining)}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        {isExpired ? (
          <button className={styles.renewBtn} onClick={() => onRenew(item)} type="button">
            <RefreshCw size={14} />
            <span>Renovar reserva</span>
          </button>
        ) : (
          <button className={styles.payBtn} onClick={() => onPay(item)} type="button">
            <CreditCard size={14} />
            <span>Pagar</span>
          </button>
        )}
        <button className={styles.removeBtn} onClick={handleRemove} type="button" aria-label="Eliminar item">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
