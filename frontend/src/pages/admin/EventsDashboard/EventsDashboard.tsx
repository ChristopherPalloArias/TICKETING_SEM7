import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminEvents } from '../../../hooks/useAdminEvents';
import EventStatusBadge from '../../../components/admin/EventStatusBadge/EventStatusBadge';
import type { StatusFilter, AdminEventResponse } from '../../../types/admin.types';
import styles from './EventsDashboard.module.css';

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Publicado', value: 'PUBLISHED' },
  { label: 'Cancelado', value: 'CANCELLED' },
];

export default function EventsDashboard() {
  const navigate = useNavigate();
  const { events, loading, error, refresh, publishEvent } = useAdminEvents();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const filtered: AdminEventResponse[] =
    filter === 'ALL' ? events : events.filter(e => e.status === filter);

  async function handlePublish(eventId: string) {
    setPublishingId(eventId);
    try {
      await publishEvent(eventId);
    } finally {
      setPublishingId(null);
    }
  }

  if (loading) {
    return <div className={styles.container}><p>Cargando eventos...</p></div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.errorMsg}>{error}</p>
        <button className={styles.retryBtn} onClick={refresh}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Eventos</h1>
        <button className={styles.createBtn} onClick={() => navigate('/admin/events/new')}>
          + Crear Evento
        </button>
      </div>

      <div className={styles.filterBar}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
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
                <th>Fecha</th>
                <th>Sala</th>
                <th>Estado</th>
                <th>Aforo</th>
                <th>Tiers</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(event => {
                const hasTiers = event.availableTiers.length > 0;
                const canPublish = event.status === 'DRAFT' && hasTiers;
                return (
                  <tr key={event.id}>
                    <td>
                      <button
                        className={styles.titleLink}
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                      >
                        {event.title}
                      </button>
                    </td>
                    <td>{new Date(event.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{event.room.name}</td>
                    <td><EventStatusBadge status={event.status} /></td>
                    <td>{event.capacity}</td>
                    <td>
                      {hasTiers
                        ? <span>{event.availableTiers.length} tiers</span>
                        : <span className={styles.noTiers}>Sin tiers</span>}
                    </td>
                    <td>
                      {event.status === 'DRAFT' && (
                        <button
                          className={styles.publishBtn}
                          disabled={!canPublish || publishingId === event.id}
                          onClick={() => handlePublish(event.id)}
                          title={!hasTiers ? 'Configura al menos un tier antes de publicar' : undefined}
                        >
                          {publishingId === event.id ? 'Publicando...' : 'Publicar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

