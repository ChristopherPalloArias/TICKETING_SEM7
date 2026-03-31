import type { TierType } from './event.types';

export interface CartItem {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventRoom: string;
  eventImageUrl: string;
  tierId: string;
  tierType: TierType;
  tierPrice: number;
  quantity: number;
  reservationId: string;
  validUntilAt: string;
  email: string;
  addedAt: string;
  expired: boolean;
  expirationAlerted: boolean;
}

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  activeItemCount: number;
}
