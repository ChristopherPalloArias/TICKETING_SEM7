import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextDef';
import type { AuthContextValue } from '../types/auth.types';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
