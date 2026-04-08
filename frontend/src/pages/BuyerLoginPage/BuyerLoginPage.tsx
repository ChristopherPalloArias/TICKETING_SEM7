import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from './BuyerLoginPage.module.css';

export default function BuyerLoginPage() {
  const { login, isAuthenticated, isLoading, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/eventos';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={role === 'ADMIN' ? '/admin/events' : from} replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    try {
      const role = await login(email, password);
      if (role === 'ADMIN') {
        navigate('/admin/events', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      const errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
      setError(errorMessage);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { id: Date.now(), type: 'error', message: errorMessage } }));
      setPassword('');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button id="login-back-btn" data-testid="login-back-btn" className={styles.backBtn} onClick={() => navigate(from)} aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Iniciar Sesión</h1>
        </div>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              data-testid="login-email-input"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Contraseña</label>
            <input
              id="password"
              data-testid="login-password-input"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className={styles.error} id="login-error-msg">{error}</p>}
          <button id="login-submit-btn" data-testid="login-submit-btn" className={styles.submitBtn} type="submit" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        <p className={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" id="login-register-link" data-testid="login-register-link" className={styles.link}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
