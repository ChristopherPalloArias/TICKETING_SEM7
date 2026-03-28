import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EventTagBadge from './EventTagBadge';
import type { EventViewModel } from '../../types/event.types';
import styles from './EventCard.module.css';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22400%22 height%3D%22533%22 viewBox%3D%220 0 400 533%22%3E%3Crect width%3D%22400%22 height%3D%22533%22 fill%3D%22%23242424%22%2F%3E%3C%2Fsvg%3E';

export type CardVariant = 'featured' | 'tall' | 'regular';

interface EventCardProps {
  event: EventViewModel;
  onReservar: (eventId: string) => void;
  variant?: CardVariant;
  index?: number;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
}

function getTagVariant(tag: string): 'filled' | 'outlined' {
  return tag === 'FEATURED PERFORMANCE' ? 'filled' : 'outlined';
}

export default function EventCard({ event, onReservar, variant = 'regular', index = 0 }: EventCardProps) {
  const isSoldOut = event.displayStatus === 'AGOTADO';
  const isBento = variant === 'featured' || variant === 'tall';

  if (isBento) {
    return (
      <motion.article
        className={`${styles.bentoCard} ${variant === 'featured' ? styles.bentoFeatured : styles.bentoTall}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => !isSoldOut && onReservar(event.id)}
        role="button"
        tabIndex={isSoldOut ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && !isSoldOut && onReservar(event.id)}
        aria-label={isSoldOut ? `${event.title} - Agotado` : `Ver ${event.title}`}
      >
        <img
          src={event.imageUrl ?? PLACEHOLDER_IMAGE}
          alt={event.title}
          className={`${styles.bentoImage} ${isSoldOut ? styles.imageSoldOut : ''}`}
        />
        <div className={styles.bentoGradient} />

        <div className={styles.bentoContent}>
          <div className={styles.bentoBadges}>
            {event.tag && (
              <EventTagBadge tag={event.tag} variant={getTagVariant(event.tag)} />
            )}
            {event.isLimited && (
              <span className={styles.limitedBadge}>Limited Seating</span>
            )}
          </div>
          <p className={styles.bentoDate}>{formatDate(event.date)}</p>
          <h3 className={styles.bentoTitle}>{event.title}</h3>
          <p className={styles.bentoVenue}>
            <MapPin size={12} />
            <span>{event.room.name}</span>
          </p>
          {event.minPrice !== null && (
            <p className={styles.bentoPrice}>
              <span className={styles.bentoPriceLabel}>Starting from</span>
              <span className={styles.bentoPriceValue}>${event.minPrice}</span>
            </p>
          )}
          <button
            disabled={isSoldOut}
            className={`${styles.btn} ${isSoldOut ? styles.btnSoldOut : styles.btnAvailable}`}
            onClick={(e) => { e.stopPropagation(); !isSoldOut && onReservar(event.id); }}
          >
            {isSoldOut ? 'Sold Out' : 'Reservar'}
          </button>
        </div>

        <div className={styles.bentoBadgeStatus}>
          <StatusBadge status={event.displayStatus} />
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
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
        {event.tag && (
          <div className={styles.tagBadgeWrapper}>
            <EventTagBadge tag={event.tag} variant={getTagVariant(event.tag)} />
          </div>
        )}
        {event.isLimited && (
          <div className={styles.limitedBadgeWrapper}>
            <span className={styles.limitedBadge}>Limited Seating</span>
          </div>
        )}
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
    </motion.article>
  );
}
