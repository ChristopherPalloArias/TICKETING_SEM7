import type { EventStatusBadgeProps } from '../../../types/admin.types';
import styles from './EventStatusBadge.module.css';

const LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
};

export default function EventStatusBadge({ status }: EventStatusBadgeProps) {
  if (!status) {
    return <span className={`${styles.badge} ${styles.draft}`}>Desconocido</span>;
  }
  return (
    <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
