import axios from 'axios';
import type {
  AdminEventsListResponse,
  EventCreateFormData,
  RoomOption,
  AdminEventResponse,
  TierFormData,
  AdminTierResponse,
  TierConfigurationResponse,
} from '../types/admin.types';

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

export async function getAdminEventById(eventId: string, userId: string): Promise<AdminEventResponse> {
  const res = await axios.get<AdminEventResponse>(`${API_BASE}/api/v1/events/${eventId}`, {
    headers: adminHeaders(userId),
  });
  return res.data;
}

export async function publishEvent(eventId: string, userId: string): Promise<AdminEventResponse> {
  const res = await axios.patch<AdminEventResponse>(
    `${API_BASE}/api/v1/events/${eventId}/publish`,
    null,
    { headers: adminHeaders(userId) },
  );
  return res.data;
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

// SPEC-016 — Tier management

export async function getEventTiers(eventId: string): Promise<TierConfigurationResponse> {
  const res = await axios.get<TierConfigurationResponse>(
    `${API_BASE}/api/v1/events/${eventId}/tiers`,
  );
  return res.data;
}

export async function addTier(
  eventId: string,
  data: TierFormData,
  userId: string,
): Promise<AdminTierResponse> {
  const res = await axios.post<AdminTierResponse>(
    `${API_BASE}/api/v1/events/${eventId}/tiers/add`,
    data,
    { headers: adminHeaders(userId) },
  );
  return res.data;
}

export async function deleteTier(
  eventId: string,
  tierId: string,
  userId: string,
): Promise<void> {
  await axios.delete(`${API_BASE}/api/v1/events/${eventId}/tiers/${tierId}`, {
    headers: adminHeaders(userId),
  });
}
