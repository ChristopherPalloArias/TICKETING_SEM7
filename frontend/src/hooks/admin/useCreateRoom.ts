import { useState } from 'react';
import { createRoom } from '../../services/adminEventService';
import type { RoomOption } from '../../types/admin.types';

interface UseCreateRoomResult {
  createNewRoom: (data: { name: string; maxCapacity: number }) => Promise<RoomOption>;
  isSubmitting: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export function useCreateRoom(): UseCreateRoomResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createNewRoom(data: { name: string; maxCapacity: number }): Promise<RoomOption> {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createRoom(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la sala';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { createNewRoom, isSubmitting, error, setError };
}
