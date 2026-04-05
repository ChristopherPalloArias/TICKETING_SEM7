export type Screen = 'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'failure';

export interface Order {
  reservationId: string;
  eventId: string;
  tierId: string;
  tierType: string;
  tierPrice: number;
  quantity: number;
  email: string;
  total: number;
  reference: string;
  seatLabels?: string[];
  enableSeats?: boolean;
}

export interface TicketInfo {
  ticketId: string;
  reservationId: string;
  eventId: string;
  tierId: string;
  tierType: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface FlowState {
  screen: Screen;
  order: Order | null;
  ticket: TicketInfo | null;
  timeLeft: number;
  retryCount: number;
}
