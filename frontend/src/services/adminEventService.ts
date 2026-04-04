import apiClient from './apiClient';
import type {
  AdminEventsListResponse,
  EventCreateFormData,
  EventUpdateFormData,
  RoomOption,
  AdminEventResponse,
  TierFormData,
  AdminTierResponse,
  TierConfigurationResponse,
} from '../types/admin.types';

export async function getAllEvents(): Promise<AdminEventsListResponse> {
  const res = await apiClient.get<AdminEventsListResponse>('/api/v1/events/admin');
  return res.data;
}

export async function getAdminEventById(eventId: string): Promise<AdminEventResponse> {
  const res = await apiClient.get<AdminEventResponse>(`/api/v1/events/admin/${eventId}`);
  return res.data;
}

export async function publishEvent(eventId: string): Promise<AdminEventResponse> {
  const res = await apiClient.patch<AdminEventResponse>(`/api/v1/events/${eventId}/publish`, null);
  return res.data;
}

export async function getAllRooms(): Promise<RoomOption[]> {
  const res = await apiClient.get<RoomOption[]>('/api/v1/rooms');
  return res.data;
}

export async function createEvent(data: EventCreateFormData) {
  const res = await apiClient.post('/api/v1/events', data);
  return res.data;
}

// SPEC-016 — Tier management

export async function getEventTiers(eventId: string): Promise<TierConfigurationResponse> {
  const res = await apiClient.get<TierConfigurationResponse>(`/api/v1/events/${eventId}/tiers`);
  return res.data;
}

export async function addTier(
  eventId: string,
  data: TierFormData,
): Promise<AdminTierResponse> {
  const res = await apiClient.post<AdminTierResponse>(
    `/api/v1/events/${eventId}/tiers/add`,
    data,
  );
  return res.data;
}

export async function deleteTier(eventId: string, tierId: string): Promise<void> {
  await apiClient.delete(`/api/v1/events/${eventId}/tiers/${tierId}`);
}

// SPEC-021 — Event editing and cancellation

export async function updateEvent(
  eventId: string,
  data: EventUpdateFormData,
): Promise<AdminEventResponse> {
  const res = await apiClient.put<AdminEventResponse>(`/api/v1/events/${eventId}`, data);
  return res.data;
}

export async function cancelEvent(
  eventId: string,
  reason: string,
): Promise<AdminEventResponse> {
  const res = await apiClient.patch<AdminEventResponse>(
    `/api/v1/events/${eventId}/cancel`,
    { cancellationReason: reason },
  );
  return res.data;
}

// Rooms management

export async function createRoom(data: { name: string; maxCapacity: number }): Promise<RoomOption> {
  const res = await apiClient.post<RoomOption>('/api/v1/rooms', data);
  return res.data;
}

export async function listAllRooms(): Promise<RoomOption[]> {
  const res = await apiClient.get<RoomOption[]>('/api/v1/rooms');
  return res.data;
}

// SPEC-022 — Admin dashboard metrics and room management

export interface AdminStatsResponse {
  totalEvents: number;
  publishedEvents: number;
  totalTicketsSold: number;
  activeReservations: number;
}

export interface AdminEventMetrics {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  date: string;
  capacity: number;
  ticketsSold: number;
  activeReservations: number;
  estimatedRevenue: number;
  roomName: string;
}

export interface AdminEventsWithMetricsResponse {
  content: AdminEventMetrics[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const res = await apiClient.get<AdminStatsResponse>('/api/v1/events/admin/stats');
  return res.data;
}

export async function getAdminEventsWithMetrics(
  { search = '', page = 0, size = 10 } = {}
): Promise<AdminEventsWithMetricsResponse> {
  const res = await apiClient.get<AdminEventsWithMetricsResponse>('/api/v1/events/admin', {
    params: { search, page, size },
  });
  return res.data;
}

export async function updateRoom(
  id: string,
  data: { name: string; maxCapacity: number }
): Promise<RoomOption> {
  const res = await apiClient.put<RoomOption>(`/api/v1/rooms/${id}`, data);
  return res.data;
}

export async function deleteRoom(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/rooms/${id}`);
}

