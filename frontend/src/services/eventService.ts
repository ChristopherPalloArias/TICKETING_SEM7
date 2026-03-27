import axios from 'axios';
import type { EventsListResponse } from '../types/event.types';

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function getEvents(): Promise<EventsListResponse> {
  const res = await axios.get<EventsListResponse>(`${API_BASE}/api/v1/events`);
  return res.data;
}
