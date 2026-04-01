import { useState } from 'react';
import { X } from 'lucide-react';
import type { RoomOption } from '../../../types/admin.types';
import styles from './RoomFormModal.module.css';

interface RoomFormModalProps {
  isOpen: boolean;
  room?: RoomOption | null;
  onClose: () => void;
  onSubmit: (data: { name: string; maxCapacity: number }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function RoomFormModal({
  isOpen,
  room,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RoomFormModalProps) {
  const [name, setName] = useState(room?.name ?? '');
  const [maxCapacity, setMaxCapacity] = useState(room ? String(room.maxCapacity) : '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre de la sala es requerido');
      return;
    }

    if (!maxCapacity || Number(maxCapacity) <= 0) {
      setError('La capacidad debe ser mayor a 0');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        maxCapacity: Number(maxCapacity),
      });
      onClose();
      setName('');
      setMaxCapacity('');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar la sala';
      setError(message);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{room ? 'Editar Sala' : 'Nueva Sala'}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="room-name" className={styles.label}>
              Nombre de la Sala
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sala Principal"
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="room-capacity" className={styles.label}>
              Capacidad Máxima
            </label>
            <input
              id="room-capacity"
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="Ej: 500"
              min="1"
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : room ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
