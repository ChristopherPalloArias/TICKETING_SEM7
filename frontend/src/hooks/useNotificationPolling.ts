import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchNotifications, fetchUnreadCount } from '../services/notificationService';
import type { BackendNotification } from '../types/notification';

const POLLING_INTERVAL_MS = 30_000;

interface UseNotificationPollingOptions {
  buyerId: string;
  enabled: boolean;
}

interface UseNotificationPollingResult {
  backendNotifications: BackendNotification[];
  unreadCount: number;
  isPolling: boolean;
}

export function useNotificationPolling({
  buyerId,
  enabled,
}: UseNotificationPollingOptions): UseNotificationPollingResult {
  const [backendNotifications, setBackendNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (!buyerId) return;
    setIsPolling(true);
    try {
      const [notifResponse, countResponse] = await Promise.all([
        fetchNotifications(buyerId),
        fetchUnreadCount(buyerId),
      ]);
      setBackendNotifications(notifResponse.content);
      setUnreadCount(countResponse.unreadCount);
    } catch (err) {
      console.error('[useNotificationPolling] Error fetching notifications:', err);
    } finally {
      setIsPolling(false);
    }
  }, [buyerId]);

  useEffect(() => {
    if (!enabled || !buyerId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    poll();
    intervalRef.current = setInterval(poll, POLLING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, buyerId, poll]);

  return { backendNotifications, unreadCount, isPolling };
}
