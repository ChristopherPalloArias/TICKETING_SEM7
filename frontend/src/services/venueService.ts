import axios from 'axios';
import type { RoomResponse } from '../types/event.types';

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function getPublicRooms(): Promise<RoomResponse[]> {
  const res = await axios.get<RoomResponse[]>(`${API_BASE}/api/v1/rooms/public`);
  return res.data;
}
