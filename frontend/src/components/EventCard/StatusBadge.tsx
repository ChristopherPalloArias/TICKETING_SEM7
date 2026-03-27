import type { EventDisplayStatus } from '../../types/event.types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: EventDisplayStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${status === 'DISPONIBLE' ? styles.disponible : styles.agotado}`}
    >
      {status}
    </span>
  );
}
