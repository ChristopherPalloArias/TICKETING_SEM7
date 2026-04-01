import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../services/authService';
import { showToast } from '../../utils/toast';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { email, token, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'La contraseña debe contener al menos una mayúscula';
    if (!/\d/.test(pwd)) return 'La contraseña debe contener al menos un número';
    return null;
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validations
    if (!currentPassword) {
      setError('La contraseña actual es requerida');
      return;
    }

    if (!newPassword) {
      setError('La nueva contraseña es requerida');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passError = validatePassword(newPassword);
    if (passError) {
      setError(passError);
      return;
    }

    if (!token) {
      showToast('Sesión expirada', 'error');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, token);
      showToast('Contraseña actualizada exitosamente', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Logout after successful password change
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message || 'Error al actualizar la contraseña';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Mi Perfil</h1>
          <p className={styles.subtitle}>Administra tu cuenta y contraseña</p>
        </header>

        <div className={styles.content}>
          {/* User Info Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Información de la Cuenta</h2>
            <div className={styles.infoBox}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Email</label>
                <p className={styles.infoValue}>{email}</p>
                <p className={styles.infoNote}>No editable</p>
              </div>
            </div>
          </section>

          {/* Change Password Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cambiar Contraseña</h2>
            <form onSubmit={handleChangePassword} className={styles.form}>
              {error && <div className={styles.errorMsg}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="current-pwd" className={styles.label}>
                  Contraseña Actual
                </label>
                <div className={styles.passwordInput}>
                  <input
                    id="current-pwd"
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    className={styles.input}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    disabled={loading}
                    aria-label="Mostrar/ocultar contraseña"
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="new-pwd" className={styles.label}>
                  Nueva Contraseña
                </label>
                <div className={styles.passwordInput}>
                  <input
                    id="new-pwd"
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    className={styles.input}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowNewPass(!showNewPass)}
                    disabled={loading}
                    aria-label="Mostrar/ocultar contraseña"
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className={styles.requirement}>
                  Mínimo 8 caracteres, 1 mayúscula y 1 número
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirm-pwd" className={styles.label}>
                  Confirmar Contraseña
                </label>
                <div className={styles.passwordInput}>
                  <input
                    id="confirm-pwd"
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    className={styles.input}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    disabled={loading}
                    aria-label="Mostrar/ocultar contraseña"
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>

              {!loading && (
                <p className={styles.infoNote}>
                  Después de cambiar tu contraseña, se cerrará tu sesión automáticamente.
                </p>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
