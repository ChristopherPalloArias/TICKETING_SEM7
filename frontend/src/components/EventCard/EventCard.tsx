import { motion } from 'framer-motion';
import type { EventViewModel } from '../../types/event.types';
import styles from './EventCard.module.css';

// Keep exported for backward compat
export type CardVariant = 'featured' | 'tall' | 'regular';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22400%22 height%3D%22533%22 viewBox%3D%220 0 400 533%22%3E%3Crect width%3D%22400%22 height%3D%22533%22 fill%3D%22%23242424%22%2F%3E%3C%2Fsvg%3E';

interface EventCardProps {
  event: EventViewModel;
  onReservar: (eventId: string) => void;
  variant?: CardVariant;
  index?: number;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

export default function EventCard({ event, onReservar, index = 0 }: EventCardProps) {
  const isSoldOut = event.displayStatus === 'AGOTADO';

  return (
    <motion.article
      className={`${styles.card} ${isSoldOut ? styles.cardSoldOut : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      onClick={() => !isSoldOut && onReservar(event.id)}
      role="button"
      tabIndex={isSoldOut ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !isSoldOut && onReservar(event.id)}
      aria-label={isSoldOut ? `${event.title} — Agotado` : `Ver ${event.title}`}
      data-testid={`event-card-${event.id}`}
    >
      {/* Image area */}
      <div className={styles.imageWrapper}>
        <img
          src={event.imageUrl ?? PLACEHOLDER_IMAGE}
          alt={event.title}
          className={`${styles.image} ${isSoldOut ? styles.imageSoldOut : ''}`}
        />

        {/* Status badge — top right */}
        <span className={`${styles.badge} ${isSoldOut ? styles.badgeSoldOut : styles.badgeAvailable}`}>
          {event.displayStatus}
        </span>

        {/* Category tag — bottom left */}
        {event.tag && (
          <span className={styles.category}>{event.tag}</span>
        )}
      </div>

      {/* Info below image */}
      <div className={styles.info}>
        <p className={styles.date}>
          {formatDate(event.date)}&nbsp;&bull;&nbsp;{event.room.name}
        </p>
        <h3 className={styles.title}>{event.title}</h3>
      </div>
    </motion.article>
  );
}
