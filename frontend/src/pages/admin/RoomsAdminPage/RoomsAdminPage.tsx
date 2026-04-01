import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAllRooms } from '../../../services/adminEventService';
import { useCreateRoom } from '../../../hooks/admin/useCreateRoom';
import RoomForm from '../../../components/admin/RoomForm/RoomForm';
import RoomCard from '../../../components/admin/RoomCard/RoomCard';
import { showToast } from '../../../utils/toast';
import type { RoomOption } from '../../../types/admin.types';
import styles from './RoomsAdminPage.module.css';

export default function RoomsAdminPage() {
  const navigate = useNavigate();
  const { createNewRoom, isSubmitting, error } = useCreateRoom();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      setLoading(true);
      const data = await listAllRooms();
      setRooms(data);
    } catch {
      showToast('Error al cargar las salas', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(data: { name: string; maxCapacity: number }) {
    try {
      const newRoom = await createNewRoom(data);
      setRooms((prev) => [...prev, newRoom]);
      setShowForm(false);
      showToast('Sala creada exitosamente', 'success');
    } catch {
      // Error manejado por el hook
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loadingMsg}>Cargando salas...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/admin/events')}>
          ← Volver
        </button>
        <h1 className={styles.title}>Gestión de Salas</h1>
      </div>

      {!showForm && (
        <button
          className={styles.createBtn}
          onClick={() => setShowForm(true)}
        >
          + Nueva Sala
        </button>
      )}

      {showForm && (
        <div className={styles.formSection}>
          <RoomForm
            onSubmit={handleCreateRoom}
            isSubmitting={isSubmitting}
            submitError={error}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className={styles.content}>
        {rooms.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No hay salas registradas</p>
            <button
              className={styles.createBtnAlt}
              onClick={() => setShowForm(true)}
            >
              + Crear la primera sala
            </button>
          </div>
        ) : (
          <div className={styles.roomList}>
            <h2 className={styles.listTitle}>
              Total: <span className={styles.count}>{rooms.length}</span> salas
            </h2>
            <div className={styles.grid}>
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
