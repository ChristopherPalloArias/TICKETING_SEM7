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

  function persistSession(newToken: string, newRole: string, profileId: string, profileEmail: string) {
    setToken(newToken);
    setRole(newRole as AdminRole);
    setUserId(profileId);
    setEmail(profileEmail);
    sessionStorage.setItem(TOKEN_KEY, newToken);
    sessionStorage.setItem(ROLE_KEY, newRole);
    sessionStorage.setItem(USER_ID_KEY, profileId);
    sessionStorage.setItem(EMAIL_KEY, profileEmail);
  }

  async function login(inputEmail: string, inputPassword: string): Promise<AdminRole> {
    setIsLoading(true);
    try {
      const response = await authService.login(inputEmail, inputPassword);
      const profile = await authService.getProfile(response.token);
      persistSession(response.token, response.role, profile.id, profile.email);
      return response.role as AdminRole;
    } finally {
      setIsLoading(false);
    }
  }

  async function registerBuyer(inputEmail: string, inputPassword: string): Promise<void> {
    setIsLoading(true);
    try {
      const response = await authService.registerBuyer(inputEmail, inputPassword);
      const profile = await authService.getProfile(response.token);
      persistSession(response.token, response.role, profile.id, profile.email);
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
    
    // ✅ LIMPIEZA ADICIONAL: Limpiar carrito en localStorage
    // Elimina todas las claves de carrito (tanto anónimo como segmentado)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sem7_shopping_cart')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`🧹 Limpiadas ${keysToRemove.length} claves de carrito en logout`);
    }
  }

  return (
    <AuthContext.Provider value={{ token, role, userId, email, isAuthenticated, isLoading, login, logout, registerBuyer }}>
      {children}
    </AuthContext.Provider>
  );
}

