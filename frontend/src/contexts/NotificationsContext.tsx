import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import {
  markAllRead as markAllReadApi,
  archiveAll as archiveAllApi,
} from '../services/notificationService';
import type { BackendNotification } from '../types/notification';

export type NotificationType = 'timer_expired' | 'payment_rejected' | 'payment_success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  eventTitle: string;
  timestamp: Date;
  read: boolean;
  reservationId?: string;
  eventId?: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (type: NotificationType, eventTitle: string, reservationId?: string, eventId?: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  setPollingEnabled: (enabled: boolean) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const BUYER_ID = '11111111-1111-1111-1111-111111111111';

const MESSAGES: Record<NotificationType, { title: string; message: (event: string) => string }> = {
  timer_expired: {
    title: 'Tiempo agotado',
    message: (event) => `El tiempo para completar tu compra de "${event}" expiró. Las entradas fueron liberadas.`,
  },
  payment_rejected: {
    title: 'Pago rechazado',
    message: (event) => `Tu pago para "${event}" fue rechazado. Puedes intentarlo de nuevo o elegir otro método.`,
  },
  payment_success: {
    title: '¡Compra confirmada!',
    message: (event) => `Tu ticket para "${event}" está listo. Revisa Mis Tickets para ver tu entrada.`,
  },
};

const BACKEND_TYPE_MAP: Record<string, NotificationType> = {
  PAYMENT_FAILED: 'payment_rejected',
  RESERVATION_EXPIRED: 'timer_expired',
  PAYMENT_SUCCESS: 'payment_success',
};

function mapBackendToApp(bn: BackendNotification): AppNotification {
  const frontendType = BACKEND_TYPE_MAP[bn.type];
  if (!frontendType) return null as unknown as AppNotification;
  const eventTitle = bn.eventName ?? 'Evento';
  const def = MESSAGES[frontendType];
  return {
    id: bn.id,
    type: frontendType,
    title: def.title,
    message: def.message(eventTitle),
    eventTitle,
    timestamp: new Date(bn.createdAt),
    read: bn.read,
    reservationId: bn.reservationId,
    eventId: bn.eventId,
  };
}

function deduplicateKey(reservationId: string | undefined, type: NotificationType): string {
  return `${reservationId ?? ''}::${type}`;
}

function mergeNotifications(
  localNotifications: AppNotification[],
  backendNotifications: BackendNotification[],
): AppNotification[] {
  const mapped = backendNotifications
    .map(mapBackendToApp)
    .filter(Boolean);

  const backendKeys = new Set(
    mapped.map((n) => deduplicateKey(n.reservationId, n.type)),
  );

  const filteredLocal = localNotifications.filter(
    (n) => !backendKeys.has(deduplicateKey(n.reservationId, n.type)),
  );

  const merged = [...mapped, ...filteredLocal];
  merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return merged;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [localNotifications, setLocalNotifications] = useState<AppNotification[]>([]);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const counterRef = useRef(0);

  const { backendNotifications, unreadCount: serverUnreadCount } = useNotificationPolling({
    buyerId: BUYER_ID,
    enabled: pollingEnabled,
  });

  const notifications = useMemo(
    () => mergeNotifications(localNotifications, backendNotifications),
    [localNotifications, backendNotifications],
  );

  const addNotification = useCallback((type: NotificationType, eventTitle: string, reservationId?: string, eventId?: string) => {
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
      reservationId,
      eventId,
    };
    setLocalNotifications((prev) => [notif, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllReadApi(BUYER_ID).catch((err) => {
      console.error('[NotificationsContext] markAllRead failed:', err);
    });
  }, []);

  const clearAll = useCallback(() => {
    const prevLocal = localNotifications;
    setLocalNotifications([]);
    archiveAllApi(BUYER_ID).catch((err) => {
      console.error('[NotificationsContext] archiveAll failed, rolling back:', err);
      setLocalNotifications(prevLocal);
    });
  }, [localNotifications]);

  const unreadCount = useMemo(() => {
    const localUnread = localNotifications.filter((n) => !n.read).length;
    const backendKeys = new Set(
      backendNotifications
        .map((bn) => {
          const ft = BACKEND_TYPE_MAP[bn.type];
          return ft ? deduplicateKey(bn.reservationId, ft) : null;
        })
        .filter(Boolean),
    );
    const uniqueLocalUnread = localNotifications.filter(
      (n) => !n.read && !backendKeys.has(deduplicateKey(n.reservationId, n.type)),
    ).length;
    return serverUnreadCount + uniqueLocalUnread;
  }, [localNotifications, backendNotifications, serverUnreadCount]);

  const setPollingEnabledCb = useCallback((enabled: boolean) => {
    setPollingEnabled(enabled);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAllRead,
      clearAll,
      setPollingEnabled: setPollingEnabledCb,
    }),
    [notifications, unreadCount, addNotification, markAllRead, clearAll, setPollingEnabledCb],
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
