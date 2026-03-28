import type { TierResponse } from './event.types';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type StatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface RoomOption {
  id: string;
  name: string;
  maxCapacity: number;
}

export interface AdminEventResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  status: EventStatus;
  room: RoomOption;
  availableTiers: TierResponse[];
  imageUrl?: string;
  subtitle?: string;
  location?: string;
  director?: string;
  castMembers?: string;
  duration?: number;
  tag?: string;
  isLimited?: boolean;
  isFeatured?: boolean;
  author?: string;
  createdBy: string;
  created_at: string;
  updated_at: string;
}

export interface AdminEventsListResponse {
  total: number;
  events: AdminEventResponse[];
}

export interface EventCreateFormData {
  title: string;
  description: string;
  date: string;
  capacity: number;
  roomId: string;
  subtitle?: string;
  imageUrl?: string;
  director?: string;
  castMembers?: string;
  duration?: number;
  location?: string;
  tag?: string;
  isLimited: boolean;
  isFeatured: boolean;
  author?: string;
}

export interface EventStatusBadgeProps {
  status: EventStatus;
}

export interface EventFormProps {
  rooms: RoomOption[];
  onSubmit: (data: EventCreateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError?: string;
}

export interface ImagePreviewProps {
  url: string;
}
