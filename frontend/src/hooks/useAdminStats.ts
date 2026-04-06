import { useState, useEffect, useCallback } from 'react';
import { getAdminStats, type AdminStatsResponse } from '../services/adminEventService';
import { useAuth } from './useAuth';

interface UseAdminStatsResult {
  stats: AdminStatsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminStats(): UseAdminStatsResult {
  const { userId } = useAuth();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminStats();
      setStats(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(message);
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
