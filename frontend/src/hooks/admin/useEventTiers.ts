import { useState, useEffect, useCallback } from 'react';
import { getEventTiers, addTier as addTierService, deleteTier as deleteTierService } from '../../services/adminEventService';
import { useAuth } from '../useAuth';
import type { AdminTierResponse, TierFormData } from '../../types/admin.types';

interface UseEventTiersReturn {
  tiers: AdminTierResponse[];
  loading: boolean;
  error: string | null;
  addTier: (data: TierFormData) => Promise<AdminTierResponse>;
  deleteTier: (tierId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEventTiers(eventId: string): UseEventTiersReturn {
  const { token } = useAuth();
  const [tiers, setTiers] = useState<AdminTierResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiers = useCallback(async () => {
    if (!eventId || !token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getEventTiers(eventId);
      setTiers(data.tiers);
    } catch {
      setError('No se pudieron cargar los tiers. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const addTier = useCallback(
    async (data: TierFormData): Promise<AdminTierResponse> => {
      if (!token) throw new Error('Usuario no autenticado');
      const newTier = await addTierService(eventId, data);
      setTiers((prev) => [...prev, newTier]);
      return newTier;
    },
    [eventId, token],
  );

  const deleteTier = useCallback(
    async (tierId: string): Promise<void> => {
      if (!token) throw new Error('Usuario no autenticado');
      await deleteTierService(eventId, tierId);
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
    },
    [eventId, token],
  );

  const refresh = useCallback(async () => {
    await fetchTiers();
  }, [fetchTiers]);

  return { tiers, loading, error, addTier, deleteTier, refresh };
}
