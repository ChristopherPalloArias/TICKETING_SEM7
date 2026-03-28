import { useState, type ReactNode } from 'react';
import type { AdminRole, AdminSession } from '../types/auth.types';
import { AuthContext } from './AuthContextDef';

const DEMO_EMAIL = 'admin@sem7.com';
const DEMO_PASSWORD = 'admin123';
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const STORAGE_KEY = 'sem7_admin_session';

interface StoredState {
  role: AdminRole | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

function readStoredSession(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const session: AdminSession = JSON.parse(raw);
      if (session.role === 'ADMIN' && session.userId && session.email) {
        return { role: session.role, userId: session.userId, email: session.email, isAuthenticated: true };
      }
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { role: null, userId: null, email: null, isAuthenticated: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(readStoredSession);

  function login(inputEmail: string, inputPassword: string): boolean {
    if (inputEmail === DEMO_EMAIL && inputPassword === DEMO_PASSWORD) {
      const session: AdminSession = {
        role: 'ADMIN',
        userId: DEMO_USER_ID,
        email: DEMO_EMAIL,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setState({ role: 'ADMIN', userId: DEMO_USER_ID, email: DEMO_EMAIL, isAuthenticated: true });
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setState({ role: null, userId: null, email: null, isAuthenticated: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

