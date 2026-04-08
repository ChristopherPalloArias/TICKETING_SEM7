import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, CreditCard } from 'lucide-react';
import styles from './BottomNav.module.css';

type ActiveTab = 'catalog' | 'venues' | 'checkout' | 'payment' | 'failure' | 'success' | string;

interface BottomNavProps {
  activeTab?: ActiveTab;
}

function resolveActiveItem(
  pathname: string,
  activeTab?: ActiveTab,
): 'explore' | 'venues' | 'payment' {
  if (activeTab === 'checkout' || activeTab === 'payment' || activeTab === 'failure' || activeTab === 'success') {
    return 'payment';
  }
  if (pathname.startsWith('/venues')) return 'venues';
  if (pathname.startsWith('/mis-tickets')) return 'payment';
  return 'explore';
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const { pathname } = useLocation();
  const active = resolveActiveItem(pathname, activeTab);

  return (
    <nav className={styles.nav} aria-label="Navegación inferior">
      <Link
        to="/eventos"
        className={`${styles.item} ${active === 'explore' ? styles.itemActive : ''}`}
        aria-label="Explorar"
        data-testid="bottom-nav-explore"
      >
        <Search size={22} className={styles.icon} />
        <span className={styles.label}>Explore</span>
      </Link>

      <Link
        to="/venues"
        className={`${styles.item} ${active === 'venues' ? styles.itemActive : ''}`}
        aria-label="Venues"
        data-testid="bottom-nav-venues"
      >
        <MapPin size={22} className={styles.icon} />
        <span className={styles.label}>Venues</span>
      </Link>

      <Link
        to="/mis-tickets"
        className={`${styles.item} ${active === 'payment' ? styles.itemActive : ''}`}
        aria-label="Mis tickets"
        data-testid="bottom-nav-tickets"
      >
        <CreditCard size={22} className={styles.icon} />
        <span className={styles.label}>My Tickets</span>
      </Link>


    </nav>
  );
}
