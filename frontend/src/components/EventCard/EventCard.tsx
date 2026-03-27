import StatusBadge from './StatusBadge';
import type { EventViewModel } from '../../types/event.types';
import styles from './EventCard.module.css';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22400%22 height%3D%22533%22 viewBox%3D%220 0 400 533%22%3E%3Crect width%3D%22400%22 height%3D%22533%22 fill%3D%22%23242424%22%2F%3E%3C%2Fsvg%3E';

interface EventCardProps {
  event: EventViewModel;
  onReservar: (eventId: string) => void;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
}

export default function EventCard({ event, onReservar }: EventCardProps) {
  const isSoldOut = event.displayStatus === 'AGOTADO';

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          src={event.imageUrl ?? PLACEHOLDER_IMAGE}
          alt={event.title}
          className={`${styles.image} ${isSoldOut ? styles.imageSoldOut : ''}`}
        />
        <div className={styles.imageOverlay} />
        <div className={styles.badgeWrapper}>
          <StatusBadge status={event.displayStatus} />
        </div>
      </div>

      <div className={styles.meta}>
        <h3 className={styles.title}>{event.title}</h3>
        <p className={styles.details}>
          <span>{formatDate(event.date)}</span>
          <span className={styles.dot}>•</span>
          <span>{event.room.name}</span>
        </p>
      </div>

      <button
        disabled={isSoldOut}
        className={`${styles.btn} ${isSoldOut ? styles.btnSoldOut : styles.btnAvailable}`}
        onClick={() => !isSoldOut && onReservar(event.id)}
      >
        {isSoldOut ? 'Sold Out' : 'Reservar'}
      </button>
    </article>
  );
}
