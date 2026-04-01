import apiClient from './apiClient';

export interface MyTicketResponse {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  tier: string;
  pricePaid: number;
  status: 'VALID' | 'CANCELLED';
  purchasedAt: string;
  buyerEmail: string;
}

export interface MyTicketsListResponse {
  content: MyTicketResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getMyTickets(
  buyerId: string,
  { page = 0, size = 10 } = {}
): Promise<MyTicketsListResponse> {
  const res = await apiClient.get<MyTicketsListResponse>('/api/v1/tickets', {
    params: { buyerId, page, size },
  });
  return res.data;
}

export async function downloadTicketPdf(ticketId: string): Promise<Blob> {
  const res = await apiClient.get<Blob>(`/api/v1/tickets/${ticketId}/pdf`, {
    responseType: 'blob',
  });
  return res.data;
}
