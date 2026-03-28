import { useNavigate } from 'react-router-dom';
import { useRooms } from '../../../hooks/useRooms';
import { useCreateEvent } from '../../../hooks/useCreateEvent';
import EventForm from '../../../components/admin/EventForm/EventForm';
import type { EventCreateFormData } from '../../../types/admin.types';
import styles from './CreateEventPage.module.css';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { rooms, loading: loadingRooms } = useRooms();
  const { createEvent, isSubmitting, error } = useCreateEvent();

  async function handleSubmit(data: EventCreateFormData) {
    const result = await createEvent(data);
    navigate(`/admin/events/${result.id}`);
  }

  if (loadingRooms) {
    return <div className={styles.container}><p>Cargando salas...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/admin/events')}>
          ← Volver
        </button>
        <h1 className={styles.title}>Crear Evento</h1>
      </div>
      <EventForm
        rooms={rooms}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={error ?? undefined}
      />
    </div>
  );
}
