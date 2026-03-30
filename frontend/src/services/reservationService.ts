import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL as string;


const DEMO_BUYER_ID = '11111111-1111-1111-1111-111111111111';

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
  buyerId: string = DEMO_BUYER_ID,
): Promise<ReservationResponse> {
  const res = await axios.post<ReservationResponse>(
    `${API_BASE}/api/v1/reservations`,
    { eventId, tierId },
    { headers: { 'X-User-Id': buyerId } }, 
  );
  return res.data;
}

export async function processPayment(
  reservationId: string,
  amount: number,
  status: 'APPROVED' | 'DECLINED',
  buyerId: string = DEMO_BUYER_ID,
): Promise<PaymentResponse> {
  const res = await axios.post<PaymentResponse>(
    `${API_BASE}/api/v1/reservations/${reservationId}/payments`,
    { amount, paymentMethod: 'MOCK', status },
    { headers: { 'X-User-Id': buyerId } }, 
  );
  return res.data;
}
