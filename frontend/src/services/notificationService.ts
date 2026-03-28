import axios from 'axios';
import type {
  PagedNotificationResponse,
  UnreadCountResponse,
  MarkAllReadResponse,
  ArchiveAllResponse,
} from '../types/notification';

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function fetchNotifications(
  buyerId: string,
  page = 0,
  size = 20,
): Promise<PagedNotificationResponse> {
  const res = await axios.get<PagedNotificationResponse>(
    `${API_BASE}/api/v1/notifications/buyer/${buyerId}`,
    {
      params: { page, size },
      headers: { 'X-User-Id': buyerId },
    },
  );
  return res.data;
}

export async function markAllRead(buyerId: string): Promise<MarkAllReadResponse> {
  const res = await axios.patch<MarkAllReadResponse>(
    `${API_BASE}/api/v1/notifications/buyer/${buyerId}/read-all`,
    null,
    { headers: { 'X-User-Id': buyerId } },
  );
  return res.data;
}

export async function fetchUnreadCount(buyerId: string): Promise<UnreadCountResponse> {
  const res = await axios.get<UnreadCountResponse>(
    `${API_BASE}/api/v1/notifications/buyer/${buyerId}/unread-count`,
    { headers: { 'X-User-Id': buyerId } },
  );
  return res.data;
}

export async function archiveAll(buyerId: string): Promise<ArchiveAllResponse> {
  const res = await axios.patch<ArchiveAllResponse>(
    `${API_BASE}/api/v1/notifications/buyer/${buyerId}/archive-all`,
    null,
    { headers: { 'X-User-Id': buyerId } },
  );
  return res.data;
}
