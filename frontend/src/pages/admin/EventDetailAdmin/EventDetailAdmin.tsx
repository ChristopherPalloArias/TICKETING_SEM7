import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminEventDetail } from '../../../hooks/admin/useAdminEventDetail';
import { useEventTiers } from '../../../hooks/admin/useEventTiers';
import { useBreadcrumbs } from '../../../hooks/admin/useBreadcrumbs';
import { useAuth } from '../../../hooks/useAuth';
import { publishEvent, cancelEvent } from '../../../services/adminEventService';
import EventStatusBadge from '../../../components/admin/EventStatusBadge/EventStatusBadge';
import TierCard from '../../../components/admin/TierCard/TierCard';
import TierForm from '../../../components/admin/TierForm/TierForm';
import CapacityBar from '../../../components/admin/CapacityBar/CapacityBar';
import PublishModal from '../../../components/admin/PublishModal/PublishModal';
import CancelEventModal from '../../../components/admin/CancelEventModal/CancelEventModal';
import Breadcrumbs from '../../../components/admin/Breadcrumbs/Breadcrumbs';
import ImagePreview from '../../../components/admin/ImagePreview/ImagePreview';
import { showToast } from '../../../utils/toast';
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
  const { segments } = useBreadcrumbs(event?.title);

  const [showTierForm, setShowTierForm] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [localTiers, setLocalTiers] = useState<AdminTierResponse[] | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
      
    }
  }

  async function handleConfirmPublish() {
    if (!event) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const updated = await publishEvent(event.id);
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

  async function handleConfirmCancel(reason: string) {
    if (!event) return;
    setCancelling(true);
    try {
      await cancelEvent(event.id, reason);
      setEvent((prev) => ({
        ...prev,
        fetchedId: prev.fetchedId,
        event: { ...event, status: 'CANCELLED' },
        error: null,
      }));
      setShowCancelModal(false);
      showToast('Evento cancelado correctamente', 'success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Error al cancelar el evento';
      showToast(msg, 'error');
    } finally {
      setCancelling(false);
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
          - Volver al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs segments={segments} />

      {/* Event Info Section */}
      <section className={styles.infoSection}>
        <div className={styles.infoHeader}>
          <div>
            <h1 className={styles.title}>{event.title}</h1>
            {event.subtitle && <p className={styles.subtitle}>{event.subtitle}</p>}
          </div>
          <div className={styles.headerActions}>
            <EventStatusBadge status={event.status} />
            <button
              className={styles.editBtn}
              onClick={() => navigate(`/admin/events/${event.id}/edit`)}
              disabled={event.status === 'CANCELLED'}
            >
              Editar
            </button>
            {isPublished && (
              <button
                className={styles.cancelEventBtn}
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
              >
                Cancelar Evento
              </button>
            )}
          </div>
        </div>

        <ImagePreview url={event.imageUrl ?? ''} />

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Fecha</span>
            <span className={styles.metaValue}>{formatDate(event.date)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Sala</span>
            <span className={styles.metaValue}>{event.room?.name ?? '-'}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Aforo</span>
            <span className={styles.metaValue}>{event.capacity} entradas</span>
          </div>
          {event.director && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Direccion</span>
              <span className={styles.metaValue}>{event.director}</span>
            </div>
          )}
          {event.duration && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Duracion</span>
              <span className={styles.metaValue}>{event.duration} min</span>
            </div>
          )}
        </div>
      </section>

      {/* Tiers Section */}
      <section className={styles.tiersSection}>
        <div className={styles.tiersHeader}>
          <h2 className={styles.sectionTitle}>Configuracion de Tiers</h2>
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
            <p className={styles.emptyText}>No hay tiers configurados aun.</p>
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

      {/* Publish Action */}
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

      <CancelEventModal
        eventId={event.id}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
