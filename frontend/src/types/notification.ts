export interface BackendNotification {
  id: string;
  reservationId: string;
  eventId: string;
  tierId: string;
  buyerId: string;
  type: 'PAYMENT_FAILED' | 'RESERVATION_EXPIRED' | 'PAYMENT_SUCCESS';
  motif: string;
  status: string;
  read: boolean;
  archived: boolean;
  eventName: string | null;
  createdAt: string;
}

export interface PagedNotificationResponse {
  content: BackendNotification[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkAllReadResponse {
  updatedCount: number;
}

export interface ArchiveAllResponse {
  archivedCount: number;
}
