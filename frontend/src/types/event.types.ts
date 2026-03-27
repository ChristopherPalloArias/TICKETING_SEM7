export type TierType = "VIP" | "GENERAL" | "EARLY_BIRD";
export type TierAvailabilityReason = "SOLD_OUT" | "EXPIRED" | null;
export type EventDisplayStatus = "DISPONIBLE" | "AGOTADO";

export interface TierResponse {
  id: string;
  tierType: TierType;
  price: string;
  quota: number;
  validFrom: string | null;
  validUntil: string | null;
  isAvailable: boolean;
  reason: TierAvailabilityReason;
}

export interface RoomResponse {
  id: string;
  name: string;
  maxCapacity: number;
}

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  room: RoomResponse;
  availableTiers: TierResponse[];
  imageUrl?: string;
  created_at: string;
  tag?: string;
  isLimited?: boolean;
  director?: string;
  cast?: string;
  duration?: number;
  author?: string;
}

export interface UseEventDetailResult {
  event: EventResponse | null;
  loading: boolean;
  error: string | null;
}

export interface EventsListResponse {
  total: number;
  events: EventResponse[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface EventViewModel extends EventResponse {
  displayStatus: EventDisplayStatus;
  minPrice: number | null;
}
