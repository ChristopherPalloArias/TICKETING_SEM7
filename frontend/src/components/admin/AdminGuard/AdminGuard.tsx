import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    return Date.now() >= expiryTime;
  } catch {
    return true;
  }
}

export default function AdminGuard() {
  const { isAuthenticated, token } = useAuth();

  if (!isAuthenticated || !token || isTokenExpired(token)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
