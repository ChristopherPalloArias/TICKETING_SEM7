import { useNavigate } from 'react-router-dom';
import EventCard from '../EventCard/EventCard';
import LoadMoreButton from './LoadMoreButton';
import LoadingSkeletons from './LoadingSkeletons';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import type { EventViewModel } from '../../types/event.types';
import styles from './EventGrid.module.css';

interface EventGridProps {
  events: EventViewModel[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function EventGrid({ events, loading, loadingMore, error, hasMore, onLoadMore }: EventGridProps) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className={styles.grid}>
        <ErrorState message={error} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.grid}>
        <LoadingSkeletons count={6} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.grid}>
        <EmptyState />
      </div>
    );
  }

  return (
    <>
      <div className={styles.regularGrid}>
        {events.map((event, i) => (
          <EventCard
            key={event.id}
            event={event}
            index={i}
            onReservar={(id) => navigate(`/eventos/${id}`)}
          />
        ))}
      </div>

      {hasMore && (
        <LoadMoreButton onClick={onLoadMore} loading={loadingMore} />
      )}
    </>
  );
}
