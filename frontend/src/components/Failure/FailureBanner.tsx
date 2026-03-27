import { XCircle } from 'lucide-react';
import styles from './FailureBanner.module.css';

interface FailureBannerProps {
  timeLeft: string;
}

export default function FailureBanner({ timeLeft }: FailureBannerProps) {
  return (
    <div className={styles.banner}>
      <div className={styles.leftBorder} />
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <XCircle size={20} className={styles.icon} />
          <strong className={styles.title}>Pago declinado.</strong>
        </div>
        <p className={styles.message}>
          Tu reserva sigue activa por{' '}
          <span className={styles.highlight}>{timeLeft}</span> minutos.
        </p>
      </div>
    </div>
  );
}
