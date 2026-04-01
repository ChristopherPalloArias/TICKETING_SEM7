import { useState } from 'react';
import { Edit, Trash2, Plus, Users } from 'lucide-react';
import { useRooms } from '../../../hooks/useRooms';
import RoomFormModal from '../../../components/admin/RoomFormModal/RoomFormModal';
import { showToast } from '../../../utils/toast';
import type { RoomOption } from '../../../types/admin.types';
import styles from './RoomsAdminPage.module.css';

const HUE_BY_INDEX = [30, 200, 280, 140, 0, 60, 320, 100];

export default function RoomsAdminPage() {
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
        <div>
          <h1 className={styles.title}>Salas</h1>
          <p className={styles.subtitle}>
            {loading ? '\u00a0' : `${rooms.length} sala${rooms.length !== 1 ? 's' : ''} registrada${rooms.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className={styles.createBtn} onClick={openCreateModal}>
          <Plus size={16} />
          Nueva Sala
        </button>
      </div>

      {loading ? (
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No hay salas registradas</p>
          <p className={styles.emptyHint}>Crea la primera sala para empezar a publicar eventos</p>
          <button className={styles.ctaBtn} onClick={openCreateModal}>
            <Plus size={16} />
            Crear Primera Sala
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {rooms.map((room, index) => {
            const hue = HUE_BY_INDEX[index % HUE_BY_INDEX.length];
            return (
              <article key={room.id} className={styles.card}>
                <div
                  className={styles.cardVisual}
                  style={{ '--hue': hue } as React.CSSProperties}
                >
                  <div className={styles.cardGradient} />
                  <span className={styles.capacityBadge}>
                    <Users size={11} />
                    {room.maxCapacity.toLocaleString('es-ES')} personas
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.cardLabel}>Sala</p>
                  <h2 className={styles.cardName}>{room.name}</h2>

                  <div className={styles.cardStats}>
                    <span className={styles.stat}>
                      <Users size={13} />
                      {room.maxCapacity.toLocaleString('es-ES')} cap. máx.
                    </span>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => openEditModal(room)}
                    >
                      <Edit size={14} />
                      Editar
                    </button>

                    {deleteConfirm === room.id ? (
                      <div className={styles.confirmDelete}>
                        <span className={styles.confirmText}>¿Eliminar sala?</span>
                        <button
                          className={styles.confirmYes}
                          onClick={() => handleDelete(room.id)}
                          disabled={isDeleting}
                        >
                          Sí, eliminar
                        </button>
                        <button
                          className={styles.confirmNo}
                          onClick={() => setDeleteConfirm(null)}
                          disabled={isDeleting}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteConfirm(room.id)}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
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
