import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAdminEventById } from '../../services/adminEventService';
import { useAuth } from '../useAuth';
import type { AdminEventResponse } from '../../types/admin.types';

interface FetchResult {
  fetchedId: string | null;
  event: AdminEventResponse | null;
  error: string | null;
}

interface UseAdminEventDetailResult {
  event: AdminEventResponse | null;
  loading: boolean;
  error: string | null;
  setEvent: React.Dispatch<React.SetStateAction<FetchResult>>;
}

export function useAdminEventDetail(): UseAdminEventDetailResult {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [result, setResult] = useState<FetchResult>({
    fetchedId: null,
    event: null,
    error: null,
  });

  useEffect(() => {
    if (!id || !token) return;
    let cancelled = false;

    getAdminEventById(id)
      .then((data) => {
        if (!cancelled) {
          setResult({ fetchedId: id, event: data, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err?.response?.status === 404
              ? 'El evento no existe.'
              : 'Error al cargar el evento. Intenta de nuevo más tarde.';
          setResult({ fetchedId: id, event: null, error: msg });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  if (!id) {
    return {
      event: null,
      loading: false,
      error: 'ID de evento no válido.',
      setEvent: setResult,
    };
  }

  const loading = result.fetchedId !== id && result.error === null;
  const event = result.fetchedId === id ? result.event : null;
  const error = result.fetchedId === id ? result.error : null;

  return { event, loading, error, setEvent: setResult };
}
