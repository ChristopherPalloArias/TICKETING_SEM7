import type { TierResponse } from './event.types';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type StatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface RoomOption {
  id: string;
  name: string;
  maxCapacity: number;
}

// SPEC-016 — Tier management & publish flow

export interface TierFormData {
  tierType: 'VIP' | 'GENERAL' | 'EARLY_BIRD';
  price: number;
  quota: number;
  validFrom?: string;
  validUntil?: string;
}

export interface AdminTierResponse {
  id: string;
  tierType: 'VIP' | 'GENERAL' | 'EARLY_BIRD';
  price: number;
  quota: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TierConfigurationResponse {
  eventId: string;
  tiers: AdminTierResponse[];
}

export interface BreadcrumbSegment {
  label: string;
  path: string;
}

export interface TierFormProps {
  eventId: string;
  eventCapacity: number;
  currentTotalQuota: number;
  onTierAdded: (tier: AdminTierResponse) => void;
  onCancel: () => void;
}

export interface TierCardProps {
  tier: AdminTierResponse;
  isDraft: boolean;
  onDelete: (tierId: string) => void;
}

export interface CapacityBarProps {
  assignedQuota: number;
  totalCapacity: number;
}

export interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

export interface PublishModalProps {
  isOpen: boolean;
  eventTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
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
  enableSeats?: boolean;
  seatsPerTier?: number;
  seatsPerRow?: number;
}

export interface EventStatusBadgeProps {
  status: EventStatus;
}

export interface EventUpdateFormData {
  title?: string;
  description?: string;
  date?: string;
  capacity?: number;
  roomId?: string;
  subtitle?: string;
  imageUrl?: string;
  director?: string;
  castMembers?: string;
  duration?: number;
  location?: string;
  tag?: string;
  isLimited?: boolean;
  isFeatured?: boolean;
  author?: string;
}

export interface CancelEventModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export interface EventFormProps {
  rooms: RoomOption[];
  onSubmit: (data: EventCreateFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError?: string;
  initialData?: Partial<EventCreateFormData>;
  disabledFields?: (keyof EventCreateFormData)[];
  mode?: 'create' | 'edit';
}

export interface ImagePreviewProps {
  url: string;
}
