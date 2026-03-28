export type AdminRole = 'ADMIN';

export interface AdminSession {
  role: AdminRole;
  userId: string;
  email: string;
}

export interface AuthContextValue {
  role: AdminRole | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}
