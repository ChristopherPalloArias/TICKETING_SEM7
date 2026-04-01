import { useState, useEffect, useCallback } from 'react';
import type { ToastDetail } from '../../utils/toast';
import styles from './Toast.module.css';

interface ToastItem extends ToastDetail {
  removing: boolean;
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const handleToast = useCallback((e: Event) => {
    const { detail } = e as CustomEvent<ToastDetail>;
    setToasts((prev) => [...prev, { ...detail, removing: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === detail.id ? { ...t, removing: true } : t)),
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 300);
    }, 3500);
  }, []);

  useEffect(() => {
    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, [handleToast]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[t.type]} ${t.removing ? styles.removing : ''}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
