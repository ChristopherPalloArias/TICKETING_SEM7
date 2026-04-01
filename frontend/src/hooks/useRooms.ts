import { useState, useEffect } from 'react';
import { getAllRooms } from '../services/adminEventService';
import { useAuth } from './useAuth';
import type { RoomOption } from '../types/admin.types';

interface UseRoomsResult {
  rooms: RoomOption[];
  loading: boolean;
  error: string | null;
}

export function useRooms(): UseRoomsResult {
  const { userId } = useAuth();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function fetchRooms() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllRooms();
        if (!cancelled) {
          setRooms(data);
        }
      } catch {
        if (!cancelled) {
          setError('No se pudieron cargar las salas.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRooms();
    return () => { cancelled = true; };
  }, [userId]);

  return { rooms, loading, error };
}
