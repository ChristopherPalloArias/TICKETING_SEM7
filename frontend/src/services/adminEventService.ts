import axios from 'axios';
import type { AdminEventsListResponse, EventCreateFormData, RoomOption } from '../types/admin.types';

const API_BASE = import.meta.env.VITE_API_URL as string;

function adminHeaders(userId: string) {
  return {
    'X-Role': 'ADMIN',
    'X-User-Id': userId,
  };
}

export async function getAllEvents(userId: string): Promise<AdminEventsListResponse> {
  const res = await axios.get<AdminEventsListResponse>(`${API_BASE}/api/v1/events/admin`, {
    headers: adminHeaders(userId),
  });
  return res.data;
}

export async function publishEvent(eventId: string, userId: string): Promise<void> {
  await axios.patch(`${API_BASE}/api/v1/events/${eventId}/publish`, null, {
    headers: adminHeaders(userId),
  });
}

export async function getAllRooms(userId: string): Promise<RoomOption[]> {
  const res = await axios.get<RoomOption[]>(`${API_BASE}/api/v1/rooms`, {
    headers: adminHeaders(userId),
  });
  return res.data;
}

export async function createEvent(data: EventCreateFormData, userId: string) {
  const res = await axios.post(`${API_BASE}/api/v1/events`, data, {
    headers: adminHeaders(userId),
  });
  return res.data;
}
