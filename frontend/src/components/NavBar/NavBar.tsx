import { useState } from 'react';
import { Link } from 'react-router-dom';
import MobileMenu from './MobileMenu';
import styles from './NavBar.module.css';

interface NavBarProps {
  activeLink?: 'eventos' | 'venues' | 'tickets';
}

export default function NavBar({ activeLink = 'eventos' }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link to="/eventos" className={styles.logo}>SEM7</Link>
          <div className={styles.links}>
            <Link
              to="/eventos"
              className={`${styles.link} ${activeLink === 'eventos' ? styles.linkActive : ''}`}
            >
              EVENTOS
            </Link>
            <a href="#" className={styles.link}>VENUES</a>
            <a href="#" className={styles.link}>MY TICKETS</a>
          </div>
        </div>

        <div className={styles.right}>
          <button className={styles.iconBtn} aria-label="Notificaciones">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button className={styles.iconBtn} aria-label="Perfil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            className={styles.iconBtn}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
