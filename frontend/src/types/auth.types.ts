export type AdminRole = 'ADMIN';

export interface AdminSession {
  role: AdminRole;
  userId: string;
  email: string;
}

export interface AuthContextValue {
  token: string | null;
  role: AdminRole | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
