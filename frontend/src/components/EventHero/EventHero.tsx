import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';
import type { EventResponse } from '../../types/event.types';
import styles from './EventHero.module.css';

interface EventHeroProps {
  event: EventResponse;
}

function formatDateRange(dateStr: string): string {
  const date = new Date(dateStr);
  const monthNames = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const day = date.getUTCDate();
  const month = monthNames[date.getUTCMonth()];
  return `${day} ${month}`;
}

export default function EventHero({ event }: EventHeroProps) {
  const dateLabel = formatDateRange(event.date);

  return (
    <div className={styles.hero}>
      {event.imageUrl && (
        <motion.img
          src={event.imageUrl}
          alt={event.title}
          className={styles.image}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      )}

      <div className={styles.vignette} />

      <div className={styles.content}>
        {event.tag && (
          <motion.span
            className={styles.badge}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {event.tag}
          </motion.span>
        )}

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {event.title.toUpperCase()}
        </motion.h1>

        {event.author && (
          <motion.p
            className={styles.author}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
          >
            {event.author}
          </motion.p>
        )}

        <motion.div
          className={styles.meta}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <span className={styles.metaItem}>{dateLabel}</span>

          <span className={styles.metaSeparator}>·</span>

          <span className={styles.metaItem}>
            <MapPin size={14} className={styles.metaIcon} />
            {event.room?.name}
          </span>

          {event.duration && (
            <>
              <span className={styles.metaSeparator}>·</span>
              <span className={styles.metaItem}>
                <Clock size={14} className={styles.metaIcon} />
                {event.duration} MIN (SIN INTERMEDIO)
              </span>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
