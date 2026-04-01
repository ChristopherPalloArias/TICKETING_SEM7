import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, Timer, LogOut } from 'lucide-react';
import MobileMenu from './MobileMenu';
import NotificationsPanel from './NotificationsPanel';
import CartBadge from '../Cart/CartBadge';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../hooks/useAuth';
import styles from './NavBar.module.css';

interface NavBarProps {
  activeLink?: 'eventos' | 'venues' | 'tickets';
  isTransactional?: boolean;
  timeLeft?: string;
}

export default function NavBar({ activeLink = 'eventos', isTransactional = false, timeLeft }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellWrapRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();
  const { activeItemCount } = useCart();
  const { isAuthenticated, role, email, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/eventos', { replace: true });
  }

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
              <Link
                to="/venues"
                className={`${styles.link} ${activeLink === 'venues' ? styles.linkActive : ''}`}
              >
                VENUES
              </Link>
              <Link
                to="/mis-tickets"
                className={`${styles.link} ${activeLink === 'tickets' ? styles.linkActive : ''}`}
              >
                MY TICKETS
              </Link>
            </div>
          )}
        </div>

        <div className={styles.right}>
          {isTransactional && timeLeft && (
            <div className={styles.timerPill}>
              <Timer size={14} />
              <span>{timeLeft}</span>
            </div>
          )}
          {!isTransactional && (
            <>
              <div ref={bellWrapRef} className={styles.bellWrap}>
                <button
                  className={styles.iconBtn}
                  aria-label="Notificaciones"
                  onClick={() => setNotifOpen((o) => !o)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>
              <Link to="/carrito" className={`${styles.iconBtn} ${styles.cartWrap}`} aria-label="Carrito de compras">
                <ShoppingCart size={20} />
                <CartBadge count={activeItemCount} />
              </Link>
              {isAuthenticated && role === 'BUYER' ? (
                <div className={styles.buyerMenu}>
                  <span className={styles.buyerEmail}>{email}</span>
                  <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Cerrar sesión">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <div className={styles.authButtons}>
                  <Link to="/login" className={styles.authBtnSecondary}>Iniciar Sesión</Link>
                  <Link to="/registro" className={styles.authBtnPrimary}>Registrarse</Link>
                </div>
              ) : (
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
              )}
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
