import { AnimatePresence, motion } from 'framer-motion';
import type { PublishModalProps } from '../../../types/admin.types';
import styles from './PublishModal.module.css';

export default function PublishModal({
  isOpen,
  eventTitle,
  onConfirm,
  onCancel,
  loading,
}: PublishModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onCancel}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.title}>Publicar evento</h2>
            <p className={styles.eventName}>{eventTitle}</p>
            <p className={styles.message}>
              ¿Publicar este evento? Una vez publicado será visible para los compradores.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.cancelBtn}
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmBtn}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
