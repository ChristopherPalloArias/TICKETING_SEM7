import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus } from 'lucide-react';
import { listAllRooms } from '../../../services/adminEventService';
import { useRooms } from '../../../hooks/useRooms';
import RoomFormModal from '../../../components/admin/RoomFormModal/RoomFormModal';
import { showToast } from '../../../utils/toast';
import type { RoomOption } from '../../../types/admin.types';
import styles from './RoomsAdminPage.module.css';

export default function RoomsAdminPage() {
  const navigate = useNavigate();
  const { rooms, loading, createNewRoom, updateExistingRoom, deleteExistingRoom } = useRooms();

  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreate(data: { name: string; maxCapacity: number }) {
    setIsSubmitting(true);
    try {
      await createNewRoom(data);
      setShowModal(false);
      showToast('Sala creada exitosamente', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la sala';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(data: { name: string; maxCapacity: number }) {
    if (!editingRoom) return;
    setIsSubmitting(true);
    try {
      await updateExistingRoom(editingRoom.id, data);
      setShowModal(false);
      setEditingRoom(null);
      showToast('Sala actualizada exitosamente', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar la sala';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(roomId: string) {
    setIsDeleting(true);
    try {
      await deleteExistingRoom(roomId);
      setDeleteConfirm(null);
      showToast('Sala eliminada exitosamente', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la sala';
      showToast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  function openCreateModal() {
    setEditingRoom(null);
    setShowModal(true);
  }

  function openEditModal(room: RoomOption) {
    setEditingRoom(room);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingRoom(null);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Salas</h1>
        <button className={styles.createBtn} onClick={openCreateModal}>
          <Plus size={18} />
          Nueva Sala
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <p className={styles.loadingMsg}>Cargando salas...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No hay salas registradas</p>
          <p className={styles.emptyHint}>Crea la primera sala para empezar</p>
          <button className={styles.ctaBtn} onClick={openCreateModal}>
            <Plus size={18} />
            Crear Primera Sala
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Capacidad</th>
                <th>Eventos Asociados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    <strong>{room.name}</strong>
                  </td>
                  <td>{room.maxCapacity} personas</td>
                  <td>{room.eventsCount ?? 0}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => openEditModal(room)}
                        title="Editar sala"
                      >
                        <Edit size={16} />
                      </button>
                      {deleteConfirm === room.id ? (
                        <div className={styles.confirmDelete}>
                          <span className={styles.confirmText}>¿Eliminar?</span>
                          <button
                            className={styles.confirmYes}
                            onClick={() => handleDelete(room.id)}
                            disabled={isDeleting}
                          >
                            Sí
                          </button>
                          <button
                            className={styles.confirmNo}
                            onClick={() => setDeleteConfirm(null)}
                            disabled={isDeleting}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeleteConfirm(room.id)}
                          title="Eliminar sala"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.summary}>
            Total: <strong>{rooms.length}</strong> salas registradas
          </div>
        </div>
      )}

      <RoomFormModal
        key={editingRoom?.id ?? 'new'}
        isOpen={showModal}
        room={editingRoom}
        onClose={closeModal}
        onSubmit={editingRoom ? handleUpdate : handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
