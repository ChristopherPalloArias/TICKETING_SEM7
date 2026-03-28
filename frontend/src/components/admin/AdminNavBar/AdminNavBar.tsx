import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import styles from './AdminNavBar.module.css';

export default function AdminNavBar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.logoSem7}>SEM7</span>
        <span className={styles.logoAdmin}> Admin</span>
      </div>
      <div className={styles.right}>
        <span className={styles.email}>{email}</span>
        <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Cerrar Sesión">
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
