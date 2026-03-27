import axios from 'axios';
import type { EventsListResponse } from '../types/event.types';

const API_BASE = import.meta.env.VITE_API_URL as string;

export interface GetEventsParams {
  page?: number;
  pageSize?: number;
}

export async function getEvents(params?: GetEventsParams): Promise<EventsListResponse> {
  const res = await axios.get<EventsListResponse>(`${API_BASE}/api/v1/events`, {
    params,
  });
  return res.data;
}
