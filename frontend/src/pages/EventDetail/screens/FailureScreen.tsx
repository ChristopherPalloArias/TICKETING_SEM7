import { CreditCard, RefreshCcw } from 'lucide-react';
import FailureBanner from '../../../components/Failure/FailureBanner';
import type { EventResponse } from '../../../types/event.types';
import type { Order } from '../../../types/flow.types';
import styles from './FailureScreen.module.css';

interface FailureScreenProps {
  event: EventResponse;
  order: Order;
  timeLeft: string;
  retryCount: number;
  timerExpired: boolean;
  onRetry: () => void;
  onChangeMethod: () => void;
}

const MAX_RETRIES = 3;

export default function FailureScreen({
  event,
  order,
  timeLeft,
  retryCount,
  timerExpired,
  onRetry,
  onChangeMethod,
}: FailureScreenProps) {
  const retriesLeft = MAX_RETRIES - retryCount;
  const canRetry = !timerExpired && retriesLeft > 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Banner */}
        <FailureBanner timeLeft={timeLeft} />

        {/* Order details */}
        <div className={styles.orderCard}>
          <h2 className={styles.orderTitle}>{event.title}</h2>
          <div className={styles.orderDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{order.enableSeats ? 'ASIENTOS' : 'TICKETS'}</span>
              <span className={styles.detailValue}>
                {order.enableSeats && order.seatLabels && order.seatLabels.length > 0
                  ? `${order.seatLabels.join(', ')} — ${order.tierType}`
                  : `${order.quantity} ticket${order.quantity !== 1 ? 's' : ''} — ${order.tierType}`}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>TOTAL</span>
              <span className={styles.totalValue}>
                ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={styles.detailRow}>
              <CreditCard size={16} className={styles.cardIcon} />
              <span className={styles.detailValue}>Visa **** 8821</span>
            </div>
          </div>
        </div>

        {/* Retry button */}
        <button
          className={styles.retryBtn}
          onClick={onRetry}
          disabled={!canRetry}
          type="button"
        >
          <RefreshCcw size={18} />
          <span>
            {retriesLeft <= 0
              ? 'Límite de intentos alcanzado'
              : `Reintentar Pago (Intento ${retryCount + 1} de ${MAX_RETRIES})`}
          </span>
        </button>

        {/* Change method */}
        <button className={styles.changeBtn} onClick={onChangeMethod} type="button">
          Usar otro método de pago
        </button>

        {/* Hint */}
        <p className={styles.hint}>
          Por favor, verifica los datos de tu tarjeta o intenta con otro método de pago.
        </p>
      </div>
    </div>
  );
}
