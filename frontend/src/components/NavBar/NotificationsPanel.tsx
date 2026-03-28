import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Timer, XCircle, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';
import type { AppNotification } from '../../contexts/NotificationsContext';
import styles from './NotificationsPanel.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  return `Hace ${Math.floor(diffH / 24)}d`;
}

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'timer_expired') return <Timer size={16} className={styles.iconTimer} />;
  return <XCircle size={16} className={styles.iconRejected} />;
}

export default function NotificationsPanel({ isOpen, onClose }: Props) {
  const { notifications, markAllRead, clearAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Mark all as read on server when panel opens
  useEffect(() => {
    if (isOpen) markAllRead();
  }, [isOpen, markAllRead]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className={styles.panel}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <Bell size={16} />
              <span className={styles.headerTitle}>Notificaciones</span>
            </div>
            {notifications.length > 0 && (
              <button
                className={styles.clearBtn}
                onClick={clearAll}
                aria-label="Borrar todas las notificaciones"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={32} className={styles.emptyIcon} />
                <p className={styles.emptyText}>Sin notificaciones</p>
                <p className={styles.emptyHint}>
                  Te avisaremos si tu tiempo de compra expira o un pago es rechazado.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${n.type === 'payment_rejected' ? styles.itemRejected : styles.itemTimer}`}
                >
                  <div className={styles.itemIcon}>
                    <NotifIcon type={n.type} />
                  </div>
                  <div className={styles.itemBody}>
                    <p className={styles.itemTitle}>{n.title}</p>
                    <p className={styles.itemEvent}>{n.eventTitle}</p>
                    <p className={styles.itemMessage}>{n.message}</p>
                    <p className={styles.itemTime}>{formatRelative(n.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
