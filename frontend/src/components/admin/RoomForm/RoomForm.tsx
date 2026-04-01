import { useState } from 'react';
import styles from './RoomForm.module.css';

interface RoomFormProps {
  onSubmit: (data: { name: string; maxCapacity: number }) => Promise<void>;
  isSubmitting: boolean;
  submitError?: string | null;
  onCancel?: () => void;
}

export default function RoomForm({ onSubmit, isSubmitting, submitError, onCancel }: RoomFormProps) {
  const [formData, setFormData] = useState({ name: '', maxCapacity: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    // Validar datos
    if (!formData.name.trim()) {
      setValidationError('El nombre de la sala es obligatorio');
      return;
    }

    const capacity = parseInt(formData.maxCapacity, 10);
    if (!formData.maxCapacity || capacity <= 0) {
      setValidationError('La capacidad debe ser un número mayor a 0');
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        maxCapacity: capacity,
      });

      // Limpiar formulario após éxito
      setFormData({ name: '', maxCapacity: '' });
    } catch {
      // Error manejado por submitError
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {(validationError || submitError) && (
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{validationError || submitError}</p>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          Nombre de la Sala
        </label>
        <input
          id="name"
          type="text"
          className={styles.input}
          placeholder="ej: Teatro Colón, Sala Principal"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          disabled={isSubmitting}
          maxLength={100}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="maxCapacity" className={styles.label}>
          Capacidad Máxima
        </label>
        <input
          id="maxCapacity"
          type="number"
          className={styles.input}
          placeholder="ej: 500"
          value={formData.maxCapacity}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, maxCapacity: e.target.value }))
          }
          disabled={isSubmitting}
          min="1"
          step="1"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creando...' : 'Crear Sala'}
        </button>
      </div>
    </form>
  );
}
