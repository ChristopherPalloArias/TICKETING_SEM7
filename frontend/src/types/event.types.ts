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
}

export interface EventsListResponse {
  total: number;
  events: EventResponse[];
}

export interface EventViewModel extends EventResponse {
  displayStatus: EventDisplayStatus;
  minPrice: number | null;
}
