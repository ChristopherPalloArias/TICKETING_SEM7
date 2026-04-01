import apiClient from './apiClient';

export interface ReservationResponse {
  id: string;
  eventId: string;
  tierId: string;
  buyerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  validUntilAt: string;
}

export interface PaymentResponse {
  reservationId: string;
  status: string;
  ticketId: string | null;
  message: string;
  ticket: {
    id: string;
    reservationId: string;
    eventId: string;
    tierId: string;
    tierType: string;
    price: number;
    status: string;
    createdAt: string;
  } | null;
  timestamp: string;
}

export async function createReservation(
  eventId: string,
  tierId: string,
): Promise<ReservationResponse> {
  const res = await apiClient.post<ReservationResponse>('/api/v1/reservations', { eventId, tierId });
  return res.data;
}

export async function processPayment(
  reservationId: string,
  amount: number,
  status: 'APPROVED' | 'DECLINED',
): Promise<PaymentResponse> {
  const res = await apiClient.post<PaymentResponse>(
    `/api/v1/reservations/${reservationId}/payments`,
    { amount, paymentMethod: 'MOCK', status },
  );
  return res.data;
}
