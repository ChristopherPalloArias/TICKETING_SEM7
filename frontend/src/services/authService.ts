import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface LoginResponse {
  token: string;
  expiresIn: number;
  role: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${API_BASE}/api/v1/auth/login`, {
    email,
    password,
  });
  return response.data;
}

export async function getProfile(token: string): Promise<UserProfile> {
  const response = await axios.get<UserProfile>(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function registerBuyer(email: string, password: string): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${API_BASE}/api/v1/auth/register/buyer`, {
    email,
    password,
  });
  return response.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<{ message: string }> {
  const response = await axios.patch<{ message: string }>(
    `${API_BASE}/api/v1/auth/me/password`,
    {
      currentPassword,
      newPassword,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}
