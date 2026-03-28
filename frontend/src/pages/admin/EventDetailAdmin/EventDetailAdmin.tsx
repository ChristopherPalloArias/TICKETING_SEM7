import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminEventDetail } from '../../../hooks/admin/useAdminEventDetail';
import { useEventTiers } from '../../../hooks/admin/useEventTiers';
import { useAuth } from '../../../hooks/useAuth';
import { publishEvent } from '../../../services/adminEventService';
import EventStatusBadge from '../../../components/admin/EventStatusBadge/EventStatusBadge';
import TierCard from '../../../components/admin/TierCard/TierCard';
import TierForm from '../../../components/admin/TierForm/TierForm';
import CapacityBar from '../../../components/admin/CapacityBar/CapacityBar';
import PublishModal from '../../../components/admin/PublishModal/PublishModal';
import type { AdminTierResponse } from '../../../types/admin.types';
import styles from './EventDetailAdmin.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventDetailAdmin() {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const { event, loading: eventLoading, error: eventError, setEvent } = useAdminEventDetail();
  const { tiers, loading: tiersLoading, error: tiersError, deleteTier } = useEventTiers(
    eventId ?? '',
  );

  const [showTierForm, setShowTierForm] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [localTiers, setLocalTiers] = useState<AdminTierResponse[] | null>(null);

  const allTiers = localTiers ?? tiers;
  const totalQuota = allTiers.reduce((sum, t) => sum + t.quota, 0);
  const isDraft = event?.status === 'DRAFT';
  const isPublished = event?.status === 'PUBLISHED';

  function handleTierAdded(tier: AdminTierResponse) {
    setLocalTiers((prev) => [...(prev ?? tiers), tier]);
    setShowTierForm(false);
  }

  async function handleDeleteTier(tierId: string) {
    try {
      await deleteTier(tierId);
      setLocalTiers((prev) => (prev ?? tiers).filter((t) => t.id !== tierId));
    } catch {
      // hook already updates tiers state on success; no-op on error
    }
  }

  async function handleConfirmPublish() {
    if (!event || !userId) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const updated = await publishEvent(event.id, userId);
      setEvent((prev) => ({
        ...prev,
        fetchedId: prev.fetchedId,
        event: { ...event, status: updated.status ?? 'PUBLISHED' },
        error: null,
      }));
      setShowPublishModal(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPublishError(
        axiosErr?.response?.data?.message || 'Error al publicar. Intenta de nuevo.',
      );
    } finally {
      setPublishing(false);
    }
  }

  if (eventLoading) {
    return <div className={styles.container}><p className={styles.stateMsg}>Cargando evento...</p></div>;
  }

  if (eventError || !event) {
    return (
      <div className={styles.container}>
        <p className={styles.errorMsg}>{eventError ?? 'Evento no encontrado.'}</p>
        <button className={styles.backBtn} onClick={() => navigate('/admin/events')}>
          â† Volver al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* â”€â”€ Event Info Section â”€â”€ */}
      <section className={styles.infoSection}>
        <div className={styles.infoHeader}>
          <div>
            <h1 className={styles.title}>{event.title}</h1>
            {event.subtitle && <p className={styles.subtitle}>{event.subtitle}</p>}
          </div>
          <EventStatusBadge status={event.status} />
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Fecha</span>
            <span className={styles.metaValue}>{formatDate(event.date)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Sala</span>
            <span className={styles.metaValue}>{event.room?.name ?? 'â€”'}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Aforo</span>
            <span className={styles.metaValue}>{event.capacity} entradas</span>
          </div>
          {event.director && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>DirecciÃ³n</span>
              <span className={styles.metaValue}>{event.director}</span>
            </div>
          )}
          {event.duration && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>DuraciÃ³n</span>
              <span className={styles.metaValue}>{event.duration} min</span>
            </div>
          )}
        </div>
      </section>

      {/* â”€â”€ Tiers Section â”€â”€ */}
      <section className={styles.tiersSection}>
        <div className={styles.tiersHeader}>
          <h2 className={styles.sectionTitle}>ConfiguraciÃ³n de Tiers</h2>
          {isDraft && !showTierForm && (
            <button
              className={styles.addTierBtn}
              onClick={() => setShowTierForm(true)}
            >
              + Agregar Tier
            </button>
          )}
        </div>

        {showTierForm && isDraft && (
          <TierForm
            eventId={event.id}
            eventCapacity={event.capacity}
            currentTotalQuota={totalQuota}
            onTierAdded={handleTierAdded}
            onCancel={() => setShowTierForm(false)}
          />
        )}

        {tiersLoading && <p className={styles.stateMsg}>Cargando tiers...</p>}
        {tiersError && <p className={styles.errorMsg}>{tiersError}</p>}

        {!tiersLoading && allTiers.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No hay tiers configurados aÃºn.</p>
            {isDraft && !showTierForm && (
              <button
                className={styles.addTierBtn}
                onClick={() => setShowTierForm(true)}
              >
                + Agregar Tier
              </button>
            )}
          </div>
        )}

        {!tiersLoading && allTiers.length > 0 && (
          <>
            <div className={styles.tierList}>
              {allTiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isDraft={isDraft}
                  onDelete={handleDeleteTier}
                />
              ))}
            </div>
            <CapacityBar
              assignedQuota={totalQuota}
              totalCapacity={event.capacity}
            />
          </>
        )}
      </section>

      {/* â”€â”€ Publish Action â”€â”€ */}
      {!isPublished && (
        <div className={styles.publishSection}>
          {publishError && <p className={styles.errorMsg}>{publishError}</p>}
          <button
            className={styles.publishBtn}
            disabled={allTiers.length === 0}
            title={
              allTiers.length === 0
                ? 'Configura al menos un tier antes de publicar'
                : undefined
            }
            onClick={() => setShowPublishModal(true)}
          >
            Publicar Evento
          </button>
        </div>
      )}

      <PublishModal
        isOpen={showPublishModal}
        eventTitle={event.title}
        onConfirm={handleConfirmPublish}
        onCancel={() => setShowPublishModal(false)}
        loading={publishing}
      />
    </div>
  );
}
