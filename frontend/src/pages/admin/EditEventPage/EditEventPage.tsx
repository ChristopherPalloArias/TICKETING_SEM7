import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getAdminEventById, updateEvent } from '../../../services/adminEventService';
import { useRooms } from '../../../hooks/useRooms';
import EventForm from '../../../components/admin/EventForm/EventForm';
import { showToast } from '../../../utils/toast';
import type { AdminEventResponse, EventCreateFormData } from '../../../types/admin.types';
import styles from './EditEventPage.module.css';

const STRUCTURAL_FIELDS: (keyof EventCreateFormData)[] = ['title', 'date', 'capacity', 'roomId'];

export default function EditEventPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { rooms, loading: loadingRooms } = useRooms();

  const [event, setEvent] = useState<AdminEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !userId) return;
    let cancelled = false;
    setLoading(true);
    getAdminEventById(eventId)
      .then((data) => {
        if (!cancelled) {
          setEvent(data);
          setFetchError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError('No se pudo cargar el evento.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId, userId]);

  async function handleSubmit(data: EventCreateFormData) {
    if (!eventId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateEvent(eventId, data);
      showToast('Evento actualizado correctamente', 'success');
      navigate(`/admin/events/${eventId}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? 'Error al actualizar el evento';
      setSubmitError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || loadingRooms) {
    return <div className={styles.container}><p className={styles.stateMsg}>Cargando...</p></div>;
  }

  if (fetchError || !event) {
    return (
      <div className={styles.container}>
        <p className={styles.errorMsg}>{fetchError ?? 'Evento no encontrado.'}</p>
        <button className={styles.backBtn} onClick={() => navigate('/admin/events')}>
          ← Volver al dashboard
        </button>
      </div>
    );
  }

  const isPublished = event.status === 'PUBLISHED';
  const disabledFields = isPublished ? STRUCTURAL_FIELDS : [];

  const initialData: Partial<EventCreateFormData> = {
    title: event.title,
    description: event.description,
    date: event.date.slice(0, 16),
    capacity: event.capacity,
    roomId: event.room.id,
    subtitle: event.subtitle,
    imageUrl: event.imageUrl,
    director: event.director,
    castMembers: event.castMembers,
    duration: event.duration,
    location: event.location,
    tag: event.tag,
    isLimited: event.isLimited ?? false,
    isFeatured: event.isFeatured ?? false,
    author: event.author,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(`/admin/events/${eventId}`)}>
          ← Volver
        </button>
        <div>
          <h1 className={styles.title}>Editar Evento</h1>
          {isPublished && (
            <p className={styles.publishedNote}>
              Evento publicado — los campos estructurales no se pueden modificar.
            </p>
          )}
        </div>
      </div>
      <EventForm
        rooms={rooms}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError ?? undefined}
        initialData={initialData}
        disabledFields={disabledFields}
        mode="edit"
      />
    </div>
  );
}
