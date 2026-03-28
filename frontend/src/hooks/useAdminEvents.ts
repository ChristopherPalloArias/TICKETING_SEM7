import { useState, useEffect, useCallback } from 'react';
import { getAllEvents, publishEvent as publishEventApi } from '../services/adminEventService';
import { useAuth } from './useAuth';
import type { AdminEventResponse } from '../types/admin.types';

interface UseAdminEventsResult {
  events: AdminEventResponse[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  publishEvent: (eventId: string) => Promise<void>;
}

export function useAdminEvents(): UseAdminEventsResult {
  const { userId } = useAuth();
  const [events, setEvents] = useState<AdminEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllEvents(userId as string);
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
    return () => { cancelled = true; };
  }, [userId, refreshTick]);

  const refresh = useCallback(() => {
    setRefreshTick(t => t + 1);
  }, []);

  const publishEvent = useCallback(async (eventId: string) => {
    if (!userId) return;
    await publishEventApi(eventId, userId);
    setEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, status: 'PUBLISHED' as const } : e)
    );
  }, [userId]);

  return { events, loading, error, refresh, publishEvent };
}
