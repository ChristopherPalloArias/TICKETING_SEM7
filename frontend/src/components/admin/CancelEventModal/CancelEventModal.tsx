import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CancelEventModalProps } from '../../../types/admin.types';
import styles from './CancelEventModal.module.css';

export default function CancelEventModal({
  isOpen,
  onClose,
  onConfirm,
}: CancelEventModalProps) {
  const [reason, setReason] = useState('');

  const isValid = reason.trim().length >= 10;

  function handleConfirm() {
    if (!isValid) return;
    onConfirm(reason.trim());
    setReason('');
  }

  function handleClose() {
    setReason('');
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.title}>Cancelar Evento</h2>
            <p className={styles.message}>
              Esta acción no se puede deshacer. El evento pasará a estado CANCELADO y los compradores serán notificados.
            </p>
            <div className={styles.field}>
              <label htmlFor="cancel-reason" className={styles.label}>
                Motivo de cancelación <span className={styles.required}>*</span>
              </label>
              <textarea
                id="cancel-reason"
                className={`${styles.textarea} ${reason.trim().length > 0 && !isValid ? styles.textareaError : ''}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Describe brevemente el motivo de la cancelación (mínimo 10 caracteres)"
                maxLength={500}
              />
              {reason.trim().length > 0 && !isValid && (
                <span className={styles.error}>Mínimo 10 caracteres requeridos</span>
              )}
              <span className={styles.hint}>{reason.trim().length} / 500</span>
            </div>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={handleClose}>
                Cancelar
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={!isValid}
              >
                Confirmar Cancelación
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
