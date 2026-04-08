import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';
import styles from './BuyerLoginPage.module.css';

export default function BuyerLoginPage() {
  const { login, isAuthenticated, isLoading, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/eventos';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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
      {/* Panel izquierdo — imagen de concierto */}
      <div className={styles.imagePanel} aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"
          alt=""
          className={styles.heroImage}
        />
      </div>

      {/* Panel derecho — formulario con card */}
      <motion.div
        key="login"
        className={styles.formPanel}
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: -90 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ perspective: '1200px' }}
      >
        {/* Botón volver — absoluto en el panel del formulario */}
        <button
          id="login-back-btn"
          data-testid="login-back-btn"
          className={styles.backBtn}
          onClick={() => navigate(from)}
          aria-label="Volver"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Iniciar Sesión</h1>
          <img src={logo} alt="SEM7" className={styles.cardLogo} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
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
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  data-testid="login-password-input"
                  className={styles.input}
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className={styles.togglePass} onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
      </motion.div>
    </div>
  );

}
