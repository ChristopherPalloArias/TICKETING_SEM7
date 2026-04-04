import { useState, useEffect, useCallback } from 'react';
import type { SeatDTO } from '../services/seatMapService';
import { getSeats } from '../services/seatMapService';

interface UseSeatMapAPIReturn {
  seats: SeatDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalAvailable: number;
  totalSeats: number;
}

/**
 * Hook para cargar y manejar la API de asientos
 * Maneja el estado de carga, errores y refresh
 */
export function useSeatMapAPI(
  eventId: string,
  tierId: string,
  token: string | null
): UseSeatMapAPIReturn {
  const [seats, setSeats] = useState<SeatDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeats = useCallback(async () => {
    if (!eventId || !tierId) {
      setError('Missing required parameters');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getSeats(eventId, tierId, token);
      setSeats(data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Sin asientos configurados: modo cuota
        setSeats([]);
        setError(null);
      } else {
        setError(err?.message || 'Error loading seats');
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, tierId, token]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const refetch = useCallback(async () => {
    await fetchSeats();
  }, [fetchSeats]);

  const totalSeats = seats.length;
  const totalAvailable = seats.filter((s) => s.status === 'AVAILABLE').length;

  return {
    seats,
    isLoading,
    error,
    refetch,
    totalAvailable,
    totalSeats,
  };
}
