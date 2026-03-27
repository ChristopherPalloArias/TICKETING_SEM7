import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShoppingCart } from 'lucide-react';
import MobileMenu from './MobileMenu';
import styles from './NavBar.module.css';

interface NavBarProps {
  activeLink?: 'eventos' | 'venues' | 'tickets';
  isTransactional?: boolean;
}

export default function NavBar({ activeLink = 'eventos', isTransactional = false }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link to="/eventos" className={styles.logo}>SEM7</Link>
          {!isTransactional && (
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
          )}
        </div>

        <div className={styles.right}>
          {!isTransactional && (
            <>
              <button className={styles.iconBtn} aria-label="Notificaciones">
                <Bell size={20} />
              </button>
              <button className={styles.iconBtn} aria-label="Carrito">
                <ShoppingCart size={20} />
              </button>
              <div className={styles.avatar}>
                <img
                  src="https://ui-avatars.com/api/?name=User&background=3A3A3A&color=E5E2E1&size=32"
                  alt="Perfil"
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                  className={styles.avatarImg}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </>
          )}
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
