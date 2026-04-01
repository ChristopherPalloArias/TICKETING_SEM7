import { useState, useEffect, useCallback } from 'react';
import { getMyTickets, type MyTicketResponse } from '../services/ticketService';
import { useAuth } from './useAuth';

interface UseMyTicketsResult {
  tickets: MyTicketResponse[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function useMyTickets(): UseMyTicketsResult {
  const { userId } = useAuth();
  const [tickets, setTickets] = useState<MyTicketResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getMyTickets(userId, { page, size: 10 });
      setTickets(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tickets';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    tickets,
    loading,
    error,
    page,
    totalPages,
    setPage,
    refetch,
  };
}
