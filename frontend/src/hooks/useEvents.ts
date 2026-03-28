import { useState, useEffect, useCallback } from 'react';
import { getEvents } from '../services/eventService';
import type { EventResponse } from '../types/event.types';

interface UseEventsResult {
  events: EventResponse[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

const PAGE_SIZE = 10;

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const data = await getEvents({ page: 1, pageSize: PAGE_SIZE });
        if (!cancelled) {
          setEvents(data.events);
          setHasMore(data.hasMore ?? false);
          setPage(1);
        }
      } catch {
        if (!cancelled) {
          setError('No se pudieron cargar los eventos. Intenta de nuevo más tarde.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getEvents({ page: nextPage, pageSize: PAGE_SIZE });
      setEvents((prev) => [...prev, ...data.events]);
      setHasMore(data.hasMore ?? false);
      setPage(nextPage);
    } catch {
      setError('No se pudieron cargar más eventos. Intenta de nuevo más tarde.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  return { events, loading, loadingMore, error, hasMore, loadMore };
}
