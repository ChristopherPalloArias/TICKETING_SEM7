import { useState, useCallback } from 'react';
import { createEvent } from '../services/adminEventService';
import { useAuth } from './useAuth';
import type { EventCreateFormData } from '../types/admin.types';

interface UseCreateEventResult {
  createEvent: (data: EventCreateFormData) => Promise<{ id: string }>;
  isSubmitting: boolean;
  error: string | null;
}

export function useCreateEvent(): UseCreateEventResult {
  const { userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async (data: EventCreateFormData): Promise<{ id: string }> => {
    if (!userId) throw new Error('Not authenticated');
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createEvent(data);
      return result;
    } catch (err: unknown) {
      let message = 'Error al crear el evento';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosErr.response?.status === 409) {
          message = 'Ya existe un evento con ese título y fecha';
        } else if (axiosErr.response?.status === 404) {
          message = 'La sala seleccionada no existe';
        } else if (axiosErr.response?.status === 400) {
          message = axiosErr.response?.data?.message ?? 'Datos inválidos';
        }
      }
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [userId]);

  return { createEvent: handleCreate, isSubmitting, error };
}
