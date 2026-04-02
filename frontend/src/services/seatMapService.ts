import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

export interface SeatDTO {
  id: string;
  eventId: string;
  tierId: string;
  row: string;
  number: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  createdAt?: string;
}

export interface AvailabilityDTO {
  eventId: string;
  tierId: string;
  available: number;
  total: number;
  availableSeats: SeatDTO[];
}

/**
 * Obtiene la lista de asientos para un tier de un evento
 * @param eventId - ID del evento (UUID)
 * @param tierId - ID del tier (UUID)
 * @param token - Token JWT del usuario autenticado
 * @returns Lista de asientos del tier
 */
export async function getSeats(eventId: string, tierId: string, token: string): Promise<SeatDTO[]> {
  try {
    const res = await axios.get(
      `${API_BASE}/api/v1/events/${eventId}/seats?tierId=${tierId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data || [];
  } catch (error) {
    console.error('Error fetching seats:', error);
    return [];
  }
}

/**
 * Obtiene disponibilidad de asientos (resumen + lista)
 * @param eventId - ID del evento
 * @param tierId - ID del tier
 * @param token - Token JWT
 * @returns Información de disponibilidad
 */
export async function getSeatAvailability(
  eventId: string,
  tierId: string,
  token: string
): Promise<AvailabilityDTO | null> {
  try {
    const res = await axios.post(
      `${API_BASE}/api/v1/events/${eventId}/seats/availability`,
      { tierId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error('Error fetching seat availability:', error);
    return null;
  }
}

/**
 * Bloquea asientos para una reserva temporal (10 minutos)
 * Requiere header X-Idempotency-Key para idempotencia
 * @param eventId - ID del evento
 * @param seatIds - Array de IDs de asientos a bloquear
 * @param idempotencyKey - Clave única para retry-safety
 * @param token - Token JWT
 * @returns Información de asientos bloqueados
 */
export async function blockSeats(
  eventId: string,
  seatIds: string[],
  idempotencyKey: string,
  token: string
): Promise<SeatDTO[] | null> {
  try {
    const res = await axios.patch(
      `${API_BASE}/api/v1/events/${eventId}/seats/block`,
      { seatIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Idempotency-Key': idempotencyKey,
        },
      }
    );
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.warn('Seats no longer available (409 Conflict)');
      throw new Error('One or more seats are no longer available');
    }
    console.error('Error blocking seats:', error);
    return null;
  }
}

/**
 * Libera asientos en caso de expiración o cancelación
 * @param eventId - ID del evento
 * @param seatIds - Array de IDs de asientos a liberar
 * @param token - Token JWT
 * @returns Información de asientos liberados
 */
export async function releaseSeats(
  eventId: string,
  seatIds: string[],
  token: string
): Promise<SeatDTO[] | null> {
  try {
    const res = await axios.patch(
      `${API_BASE}/api/v1/events/${eventId}/seats/release`,
      { seatIds },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error('Error releasing seats:', error);
    return null;
  }
}

/**
 * Vende asientos (marca como SOLD después de pago exitoso)
 * @param eventId - ID del evento
 * @param seatIds - Array de IDs de asientos
 * @param token - Token JWT
 * @returns Información de asientos vendidos
 */
export async function sellSeats(
  eventId: string,
  seatIds: string[],
  token: string
): Promise<SeatDTO[] | null> {
  try {
    const res = await axios.patch(
      `${API_BASE}/api/v1/events/${eventId}/seats/sell`,
      { seatIds },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error('Error selling seats:', error);
    return null;
  }
}

/**
 * Obtiene métricas de capacidad de un tier
 * @param eventId - ID del evento
 * @param tierId - ID del tier
 * @param token - Token JWT
 * @returns Métricas de capacidad
 */
export async function getSeatMetrics(
  eventId: string,
  tierId: string,
  token: string
): Promise<any | null> {
  try {
    const res = await axios.get(
      `${API_BASE}/api/v1/events/${eventId}/seats/metrics?tierId=${tierId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error('Error fetching seat metrics:', error);
    return null;
  }
}
