import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import styles from './AdminNavBar.module.css';

export default function AdminNavBar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  const isEventsActive = location.pathname.includes('/admin/events');
  const isRoomsActive = location.pathname === '/admin/rooms';

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.logoSem7}>SEM7</span>
        <span className={styles.logoAdmin}> Admin</span>
      </div>

      <div className={styles.menu}>
        <button
          className={`${styles.menuLink} ${isEventsActive ? styles.active : ''}`}
          onClick={() => navigate('/admin/events')}
        >
          Eventos
        </button>
        <button
          className={`${styles.menuLink} ${isRoomsActive ? styles.active : ''}`}
          onClick={() => navigate('/admin/rooms')}
        >
          Salas
        </button>
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
