import apiClient from './apiClient';
import type {
  PagedNotificationResponse,
  UnreadCountResponse,
  MarkAllReadResponse,
  ArchiveAllResponse,
} from '../types/notification';

export async function fetchNotifications(
  buyerId: string,
  page = 0,
  size = 20,
): Promise<PagedNotificationResponse> {
  const res = await apiClient.get<PagedNotificationResponse>(
    `/api/v1/notifications/buyer/${buyerId}`,
    { params: { page, size } },
  );
  return res.data;
}

export async function markAllRead(buyerId: string): Promise<MarkAllReadResponse> {
  const res = await apiClient.patch<MarkAllReadResponse>(
    `/api/v1/notifications/buyer/${buyerId}/read-all`,
    null,
  );
  return res.data;
}

export async function fetchUnreadCount(buyerId: string): Promise<UnreadCountResponse> {
  const res = await apiClient.get<UnreadCountResponse>(
    `/api/v1/notifications/buyer/${buyerId}/unread-count`,
  );
  return res.data;
}

export async function archiveAll(buyerId: string): Promise<ArchiveAllResponse> {
  const res = await apiClient.patch<ArchiveAllResponse>(
    `/api/v1/notifications/buyer/${buyerId}/archive-all`,
    null,
  );
  return res.data;
}
