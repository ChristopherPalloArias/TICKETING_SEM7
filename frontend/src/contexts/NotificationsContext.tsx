import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type NotificationType = 'timer_expired' | 'payment_rejected';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  eventTitle: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (type: NotificationType, eventTitle: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const MESSAGES: Record<NotificationType, { title: string; message: (event: string) => string }> = {
  timer_expired: {
    title: 'Tiempo agotado',
    message: (event) => `El tiempo para completar tu compra de "${event}" expiró. Las entradas fueron liberadas.`,
  },
  payment_rejected: {
    title: 'Pago rechazado',
    message: (event) => `Tu pago para "${event}" fue rechazado. Puedes intentarlo de nuevo o elegir otro método.`,
  },
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const counterRef = useRef(0);

  const addNotification = useCallback((type: NotificationType, eventTitle: string) => {
    const def = MESSAGES[type];
    const id = `notif-${Date.now()}-${counterRef.current++}`;
    const notif: AppNotification = {
      id,
      type,
      title: def.title,
      message: def.message(eventTitle),
      eventTitle,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, addNotification, markAllRead, clearAll }),
    [notifications, unreadCount, addNotification, markAllRead, clearAll],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
