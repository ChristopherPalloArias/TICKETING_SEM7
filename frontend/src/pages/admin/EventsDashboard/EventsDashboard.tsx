import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import StatsCards from '../../../components/admin/StatsCards/StatsCards';
import EventStatusBadge from '../../../components/admin/EventStatusBadge/EventStatusBadge';
import { getAdminEventsWithMetrics, getAdminStats } from '../../../services/adminEventService';
import { useAdminStats } from '../../../hooks/useAdminStats';
import { showToast } from '../../../utils/toast';
import type { AdminEventMetrics, AdminStatsResponse } from '../../../services/adminEventService';
import styles from './EventsDashboard.module.css';

export default function EventsDashboard() {
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useAdminStats();

  const [events, setEvents] = useState<AdminEventMetrics[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
  }, [search]);

  // Fetch events with metrics
  useEffect(() => {
    loadEvents();
  }, [debouncedSearch, page]);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminEventsWithMetrics({
        search: debouncedSearch,
        page,
        size: 10,
      });
      setEvents(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar eventos';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleCapacityPercent(sold: number, capacity: number): string {
    if (capacity === 0) return '0%';
    return `${Math.round((sold / capacity) * 100)}%`;
  }

  if (error && !loading) {
    return (
      <div className={styles.container}>
        <p className={styles.errorMsg}>{error}</p>
        <button className={styles.retryBtn} onClick={loadEvents}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard de Eventos</h1>
        <button className={styles.createBtn} onClick={() => navigate('/admin/events/new')}>
          + Crear Evento
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar eventos por título..."
          className={styles.searchInput}
          disabled={loading}
        />
        {search && (
          <button
            className={styles.clearBtn}
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Events Table */}
      {loading ? (
        <div className={styles.loadingMsg}>Cargando eventos...</div>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>
          <TrendingUp size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            {search ? 'No hay eventos que coincidan con tu búsqueda' : 'No hay eventos aún'}
          </p>
          <button className={styles.createBtn} onClick={() => navigate('/admin/events/new')}>
            Crear Primer Evento
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha</th>
                <th>Sala</th>
                <th>Estado</th>
                <th>Ocupación</th>
                <th>Reservas</th>
                <th>Ingresos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <button
                      className={styles.titleLink}
                      onClick={() => navigate(`/admin/events/${event.id}`)}
                    >
                      {event.title}
                    </button>
                  </td>
                  <td>
                    {new Date(event.date).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>{event.roomName || '-'}</td>
                  <td>
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td>
                    <div className={styles.occupancyCell}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${handleCapacityPercent(event.ticketsSold, event.capacity)}`,
                          }}
                        />
                      </div>
                      <span className={styles.occupancyText}>
                        {event.ticketsSold}/{event.capacity}
                      </span>
                    </div>
                  </td>
                  <td>{event.activeReservations}</td>
                  <td className={styles.revenueCell}>
                    ${event.estimatedRevenue.toLocaleString('es-ES')}
                  </td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => navigate(`/admin/events/${event.id}`)}
                      title="Ver detalles"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || loading}
                className={styles.paginationBtn}
              >
                ← Anterior
              </button>
              <span className={styles.pageInfo}>
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1 || loading}
                className={styles.paginationBtn}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

