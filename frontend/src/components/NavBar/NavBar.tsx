import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Timer, LogOut, Search, X } from 'lucide-react';
import MobileMenu from './MobileMenu';
import NotificationsPanel from './NotificationsPanel';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import logo from '../../assets/logo.png';
import styles from './NavBar.module.css';

const SEARCH_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2248%22 height%3D%2264%22 viewBox%3D%220 0 48 64%22%3E%3Crect width%3D%2248%22 height%3D%2264%22 fill%3D%22%23242424%22%2F%3E%3C%2Fsvg%3E';

function formatSearchDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

interface NavBarProps {
  activeLink?: 'eventos' | 'venues' | 'tickets';
  isTransactional?: boolean;
  timeLeft?: string;
}

export default function NavBar({ activeLink = 'eventos', isTransactional = false, timeLeft }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const bellWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { unreadCount } = useNotifications();
  const { isAuthenticated, role, email, logout } = useAuth();
  const { events } = useEvents();
  const navigate = useNavigate();

  function openSearch() { setSearchQuery(''); setSearchOpen(true); }
  function closeSearch() { setSearchOpen(false); setSearchQuery(''); }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSearch();
    }
    if (searchOpen) {
      document.addEventListener('keydown', handleKey);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

  const searchResults = searchQuery.trim().length > 1
    ? events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : [];

  function handleResultClick(id: string) { closeSearch(); navigate(`/eventos/${id}`); }

  function handleLogout() {
    logout();
    navigate('/eventos', { replace: true });
  }

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <Link to="/eventos" className={styles.logo}>
            <img
              src={logo}
              alt="SEM7"
              className={styles.logoImg}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span className={styles.logoFallback}>SEM7</span>
          </Link>
          {!isTransactional && (
            <div className={styles.links}>
              <Link
                to="/eventos"
                id="nav-link-eventos"
                data-testid="navbar-link-events"
                className={`${styles.link} ${activeLink === 'eventos' ? styles.linkActive : ''}`}
              >
                EVENTOS
              </Link>
              <Link
                to="/venues"
                id="nav-link-venues"
                className={`${styles.link} ${activeLink === 'venues' ? styles.linkActive : ''}`}
              >
                SALAS
              </Link>
              <Link
                to="/mis-tickets"
                id="nav-link-tickets"
                data-testid="navbar-link-tickets"
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
              {/* Search button */}
              <button
                className={styles.iconBtn}
                aria-label="Buscar eventos"
                onClick={openSearch}
                data-testid="navbar-search-btn"
              >
                <Search size={20} />
              </button>

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
              {isAuthenticated && role === 'BUYER' ? (
                <div className={styles.buyerMenu}>
                  <span className={styles.buyerEmail} id="nav-user-email">{email}</span>
                  <button id="nav-btn-logout" data-testid="navbar-logout-btn" className={styles.logoutBtn} onClick={handleLogout} aria-label="Cerrar sesión">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <div className={styles.authButtons}>
                  <Link to="/login" id="nav-btn-login" data-testid="navbar-login-btn" className={styles.authBtnSecondary}>Iniciar Sesión</Link>
                  <Link to="/registro" id="nav-btn-register" data-testid="navbar-register-btn" className={styles.authBtnPrimary}>Registrarse</Link>
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

      {/* Search overlay modal */}
      {searchOpen && (
        <div
          className={styles.searchOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Búsqueda de eventos"
        >
          <div className={styles.searchBox}>
            <div className={styles.searchInputWrap}>
              <Search size={20} className={styles.searchInputIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar evento por nombre"
              />
              <button className={styles.searchCloseBtn} onClick={closeSearch} aria-label="Cerrar búsqueda">
                <X size={18} />
              </button>
            </div>

            {searchResults.length > 0 && (
              <ul className={styles.searchResults}>
                {searchResults.map((event) => (
                  <li key={event.id}>
                    <button
                      className={styles.searchResultItem}
                      onClick={() => handleResultClick(event.id)}
                    >
                      <img
                        src={event.imageUrl ?? SEARCH_PLACEHOLDER}
                        alt={event.title}
                        className={styles.searchResultThumb}
                      />
                      <div className={styles.searchResultInfo}>
                        <span className={styles.searchResultTitle}>{event.title}</span>
                        <span className={styles.searchResultDate}>
                          {formatSearchDate(event.date)} · {event.room.name}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searchQuery.trim().length > 1 && searchResults.length === 0 && (
              <p className={styles.searchEmpty}>No se encontraron eventos para "{searchQuery}"</p>
            )}
          </div>
        </div>
      )}

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
