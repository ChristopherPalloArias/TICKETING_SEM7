import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, Ticket } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className={styles.nav} aria-label="Navegación inferior">
      <Link
        to="/eventos"
        className={`${styles.item} ${isActive('/eventos') ? styles.itemActive : ''}`}
        aria-label="Explorar"
      >
        <Search size={22} className={styles.icon} />
        <span className={styles.label}>Explore</span>
      </Link>

      <Link
        to="/venues"
        className={`${styles.item} ${isActive('/venues') ? styles.itemActive : ''}`}
        aria-label="Venues"
      >
        <MapPin size={22} className={styles.icon} />
        <span className={styles.label}>Venues</span>
      </Link>

      <Link
        to="/tickets"
        className={`${styles.item} ${isActive('/tickets') ? styles.itemActive : ''}`}
        aria-label="Mis tickets"
      >
        <Ticket size={22} className={styles.icon} />
        <span className={styles.label}>Tickets</span>
      </Link>
    </nav>
  );
}
