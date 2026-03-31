import { useState, type ReactNode } from 'react';
import type { AdminRole } from '../types/auth.types';
import { AuthContext } from './AuthContextDef';
import * as authService from '../services/authService';

const TOKEN_KEY = 'jwt_token';
const ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';
const EMAIL_KEY = 'user_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState<AdminRole | null>(
    () => sessionStorage.getItem(ROLE_KEY) as AdminRole | null
  );
  const [userId, setUserId] = useState<string | null>(() => sessionStorage.getItem(USER_ID_KEY));
  const [email, setEmail] = useState<string | null>(() => sessionStorage.getItem(EMAIL_KEY));
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!token;

  async function login(inputEmail: string, inputPassword: string): Promise<void> {
    setIsLoading(true);
    try {
      const response = await authService.login(inputEmail, inputPassword);
      const profile = await authService.getProfile(response.token);

      setToken(response.token);
      setRole(response.role as AdminRole);
      setUserId(profile.id);
      setEmail(profile.email);

      sessionStorage.setItem(TOKEN_KEY, response.token);
      sessionStorage.setItem(ROLE_KEY, response.role);
      sessionStorage.setItem(USER_ID_KEY, profile.id);
      sessionStorage.setItem(EMAIL_KEY, profile.email);
    } finally {
      setIsLoading(false);
    }
  }

  function logout(): void {
    setToken(null);
    setRole(null);
    setUserId(null);
    setEmail(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
  }

  return (
    <AuthContext.Provider value={{ token, role, userId, email, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

