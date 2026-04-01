import { useState, useEffect } from 'react';
import {
  listAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../services/adminEventService';
import { useAuth } from './useAuth';
import type { RoomOption } from '../types/admin.types';

interface UseRoomsResult {
  rooms: RoomOption[];
  loading: boolean;
  error: string | null;
  createNewRoom: (data: { name: string; maxCapacity: number }) => Promise<RoomOption>;
  updateExistingRoom: (id: string, data: { name: string; maxCapacity: number }) => Promise<RoomOption>;
  deleteExistingRoom: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useRooms(): UseRoomsResult {
  const { userId } = useAuth();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listAllRooms();
      setRooms(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar salas';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [userId]);

  const createNewRoom = async (data: { name: string; maxCapacity: number }): Promise<RoomOption> => {
    try {
      const newRoom = await createRoom(data);
      setRooms((prev) => [...prev, newRoom]);
      return newRoom;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear sala';
      throw new Error(message);
    }
  };

  const updateExistingRoom = async (
    id: string,
    data: { name: string; maxCapacity: number }
  ): Promise<RoomOption> => {
    try {
      const updated = await updateRoom(id, data);
      setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar sala';
      throw new Error(message);
    }
  };

  const deleteExistingRoom = async (id: string): Promise<void> => {
    try {
      await deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar sala';
      throw new Error(message);
    }
  };

  return {
    rooms,
    loading,
    error,
    createNewRoom,
    updateExistingRoom,
    deleteExistingRoom,
    refetch,
  };
}
