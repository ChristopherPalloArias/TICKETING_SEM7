import { useNavigate } from 'react-router-dom';
import EventCard from '../EventCard/EventCard';
import LoadingSkeletons from './LoadingSkeletons';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import type { EventViewModel } from '../../types/event.types';
import styles from './EventGrid.module.css';

interface EventGridProps {
  events: EventViewModel[];
  loading: boolean;
  error: string | null;
}

export default function EventGrid({ events, loading, error }: EventGridProps) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className={styles.grid}>
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {loading ? (
        <LoadingSkeletons count={6} />
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onReservar={(id) => navigate(`/eventos/${id}`)}
          />
        ))
      )}
    </div>
  );
}
