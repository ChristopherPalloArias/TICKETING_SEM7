import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { EventResponse, UseEventDetailResult } from '../types/event.types';
import { getEventById } from '../services/eventService';

interface FetchResult {
  fetchedId: string | null;
  event: EventResponse | null;
  error: string | null;
}

export function useEventDetail(): UseEventDetailResult {
  const { id } = useParams<{ id: string }>();

  const [result, setResult] = useState<FetchResult>({
    fetchedId: null,
    event: null,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    getEventById(id)
      .then((data) => {
        if (!cancelled) {
          setResult({ fetchedId: id, event: data, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err?.response?.status === 404
              ? 'El evento no existe o no está disponible.'
              : 'Error al cargar el evento. Intenta de nuevo más tarde.';
          setResult({ fetchedId: id, event: null, error: msg });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return { event: null, loading: false, error: 'ID de evento no válido.' };
  }

  const loading = result.fetchedId !== id && result.error === null;
  const event = result.fetchedId === id ? result.event : null;
  const error = result.fetchedId === id ? result.error : null;

  return { event, loading, error };
}
