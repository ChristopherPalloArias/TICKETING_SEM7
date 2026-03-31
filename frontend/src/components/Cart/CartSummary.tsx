import type { CartItem } from '../../types/cart.types';
import styles from './CartSummary.module.css';

interface CartSummaryProps {
  items: CartItem[];
}

const SERVICE_FEE = 10;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

export default function CartSummary({ items }: CartSummaryProps) {
  const activeItems = items.filter(
    (i) => !i.expired && new Date(i.validUntilAt).getTime() > Date.now(),
  );

  const subtotal = activeItems.reduce((sum, i) => sum + i.tierPrice * i.quantity, 0);
  const totalServiceFees = activeItems.length * SERVICE_FEE;
  const total = subtotal + totalServiceFees;

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Resumen</h3>

      <div className={styles.row}>
        <span>Subtotal ({activeItems.length} reserva{activeItems.length !== 1 ? 's' : ''})</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div className={styles.row}>
        <span>Tarifa de servicio ({formatCurrency(SERVICE_FEE)} × {activeItems.length})</span>
        <span>{formatCurrency(totalServiceFees)}</span>
      </div>

      <div className={styles.divider} />

      <div className={`${styles.row} ${styles.total}`}>
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
