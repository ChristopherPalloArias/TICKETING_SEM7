import { useState, useEffect } from 'react';
import { getEvents } from '../services/eventService';
import type { EventResponse } from '../types/event.types';

interface UseEventsResult {
  events: EventResponse[];
  loading: boolean;
  error: string | null;
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const data = await getEvents();
        if (!cancelled) {
          setEvents(data.events);
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

  return { events, loading, error };
}
