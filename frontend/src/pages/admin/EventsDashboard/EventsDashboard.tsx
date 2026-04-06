import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../../../components/admin/StatsCards/StatsCards';
import EventStatusBadge from '../../../components/admin/EventStatusBadge/EventStatusBadge';
import { useAdminEvents } from '../../../hooks/useAdminEvents';
import { useAdminStats } from '../../../hooks/useAdminStats';
import styles from './EventsDashboard.module.css';

const FILTER_OPTIONS = ['Todos', 'Borrador', 'Publicado', 'Cancelado'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const FILTER_TO_STATUS: Record<string, string> = {
  Borrador: 'DRAFT',
  Publicado: 'PUBLISHED',
  Cancelado: 'CANCELLED',
};

export default function EventsDashboard() {
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useAdminStats();
  const { events, loading, error, refresh, publishEvent } = useAdminEvents();
  const [statusFilter, setStatusFilter] = useState<FilterOption>('Todos');

  const filteredEvents =
    statusFilter === 'Todos'
      ? events
      : events.filter((e) => e.status === FILTER_TO_STATUS[statusFilter]);

  if (error && !loading) {
    return (
      <div className={styles.container}>
        <p className={styles.errorMsg}>{error}</p>
        <button className={styles.retryBtn} onClick={refresh}>
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

      <StatsCards stats={stats} loading={statsLoading} />

      <div className={styles.filters}>
        {FILTER_OPTIONS.map((label) => (
          <button
            key={label}
            className={statusFilter === label ? styles.filterActive : styles.filterBtn}
            onClick={() => setStatusFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingMsg}>Cargando eventos...</div>
      ) : filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No hay eventos aún</p>
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
                <th>Sala</th>
                <th>Tiers</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <button
                      className={styles.titleLink}
                      onClick={() => navigate(`/admin/events/${event.id}`)}
                    >
                      {event.title}
                    </button>
                  </td>
                  <td>{event.room?.name ?? '-'}</td>
                  <td>
                    {event.availableTiers.length === 0 ? (
                      <span className={styles.noTiersWarning}>Sin tiers</span>
                    ) : (
                      <span>{event.availableTiers.length} tiers</span>
                    )}
                  </td>
                  <td>
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td>
                    {event.status === 'DRAFT' && (
                      <button
                        className={styles.publishBtn}
                        disabled={event.availableTiers.length === 0}
                        onClick={() => publishEvent(event.id)}
                      >
                        Publicar
                      </button>
                    )}
                    <button
                      className={styles.viewBtn}
                      onClick={() => navigate(`/admin/events/${event.id}`)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

