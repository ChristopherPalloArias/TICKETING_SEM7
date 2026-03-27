import { Ticket } from 'lucide-react';
import type { EventResponse, TierResponse } from '../../types/event.types';
import styles from './OrderSummary.module.css';

interface OrderSummaryProps {
  event: EventResponse;
  tier: TierResponse;
  quantity: number;
}

export default function OrderSummary({ event, tier, quantity }: OrderSummaryProps) {
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = eventDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className={styles.card}>
      <div className={styles.ticketIcon}>
        <Ticket size={20} />
      </div>
      <h3 className={styles.label}>RESUMEN DE PEDIDO</h3>

      <div className={styles.row}>
        <span className={styles.detail}>{quantity}x {tier.tierType}</span>
        <span className={styles.value}>{event.title}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>FECHA</span>
          <span className={styles.infoValue}>{dateStr}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>HORA</span>
          <span className={styles.infoValue}>{timeStr}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>ASIENTOS</span>
          <span className={styles.infoValue}>B12, B13</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>UBICACIÓN</span>
          <span className={styles.infoValue}>{event.room?.name ?? 'Main Stage Loft'}</span>
        </div>
      </div>
    </div>
  );
}
