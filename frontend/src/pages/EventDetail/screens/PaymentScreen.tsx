import { useState } from 'react';
import MockPaymentOption from '../../../components/Payment/MockPaymentOption';
import type { EventResponse } from '../../../types/event.types';
import type { Order } from '../../../types/flow.types';
import styles from './PaymentScreen.module.css';

interface PaymentScreenProps {
  event: EventResponse;
  order: Order;
  onSimulate: (type: 'success' | 'failure') => Promise<void>;
}

export default function PaymentScreen({ event, order, onSimulate }: PaymentScreenProps) {
  const [loading, setLoading] = useState<'success' | 'failure' | null>(null);

  const handleSimulate = async (type: 'success' | 'failure') => {
    setLoading(type);
    try {
      await onSimulate(type);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Total display */}
        <div className={styles.totalSection}>
          <span className={styles.totalAmount}>
            ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <p className={styles.totalDesc}>
            Total de la reserva por {order.quantity} {order.quantity === 1 ? 'entrada' : 'entradas'} {order.tierType}
          </p>
        </div>

        {/* Simulation options */}
        <div className={styles.optionsGrid}>
          <MockPaymentOption
            type="success"
            onClick={() => handleSimulate('success')}
            loading={loading !== null}
          />
          <MockPaymentOption
            type="failure"
            onClick={() => handleSimulate('failure')}
            loading={loading !== null}
          />
        </div>

        {/* Order summary bottom */}
        <div className={styles.orderSummary}>
          <div className={styles.referenceRow}>
            <span className={styles.referenceLabel}>REFERENCIA</span>
            <span className={styles.referenceValue}>{order.reference}</span>
          </div>

          <div className={styles.eventPreview}>
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt={event.title}
                className={styles.eventThumb}
              />
            )}
            <div className={styles.eventInfo}>
              <span className={styles.eventName}>{event.title}</span>
              <span className={styles.eventAccess}>Acceso {order.tierType} — Sector B</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
