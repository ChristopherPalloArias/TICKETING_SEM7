import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import styles from './BuyerRegisterPage.module.css';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'Debe contener al menos 1 mayúscula';
  if (!/[0-9]/.test(password)) return 'Debe contener al menos 1 número';
  return null;
}

export default function BuyerRegisterPage() {
  const { registerBuyer, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

    try {
      await registerBuyer(email, password);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { id: Date.now(), type: 'success', message: '¡Registro exitoso! Iniciando sesión...' } }));
      navigate('/eventos', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      let errorMsg = 'Error al crear la cuenta. Intenta de nuevo.';
      if (axiosErr?.response?.status === 409) {
        errorMsg = 'El email ya está registrado. Intenta iniciar sesión.';
      } else if (axiosErr?.response?.data?.message) {
        errorMsg = axiosErr.response.data.message;
      }
      setError(errorMsg);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { id: Date.now(), type: 'error', message: errorMsg } }));
    }
  }

  return (
    <div className={styles.page}>
      {/* Panel izquierdo — branding */}
      <div className={styles.brandPanel} aria-hidden="true">
        <div className={styles.brandOverlay} />
        <div className={styles.brandContent}>
          <span className={styles.brandLogo}>SEM7</span>
          <p className={styles.brandTagline}>La experiencia de teatro<br />que esperabas.</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <motion.div
        key="register"
        className={styles.formPanel}
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: -90 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ perspective: '1200px' }}
      >
        <div className={styles.formCard}>
          <button
            id="register-back-btn"
            data-testid="register-back-btn"
            className={styles.backBtn}
            onClick={() => navigate('/eventos')}
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <h1 className={styles.title}>Crear Cuenta</h1>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                data-testid="register-email-input"
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
                data-testid="register-password-input"
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <span className={styles.hint}>Mínimo 8 caracteres, 1 mayúscula y 1 número</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                data-testid="register-confirm-password"
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className={styles.error} id="register-error-msg">{error}</p>}
            <button id="register-submit-btn" data-testid="register-submit-btn" className={styles.submitBtn} type="submit" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
          <p className={styles.footer}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" id="register-login-link" data-testid="register-login-link" className={styles.link}>Inicia sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
