import type { TicketInfo } from '../types/flow.types';
import type { EventResponse } from '../types/event.types';

const STORAGE_KEY = 'sem7_my_tickets';

export interface StoredTicket {
  ticket: TicketInfo;
  event: Pick<EventResponse, 'id' | 'title' | 'date' | 'room' | 'imageUrl'>;
  tierType: string;
  quantity: number;
  total: number;
  email: string;
  reference: string;
  purchasedAt: string;
}

export function saveTicket(entry: StoredTicket): void {
  const current = getTickets();
  current.unshift(entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Quota exceeded — trim oldest entries
    const trimmed = current.slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

export function getTickets(): StoredTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTicket[]) : [];
  } catch {
    return [];
  }
}
