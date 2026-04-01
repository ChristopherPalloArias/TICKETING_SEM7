import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Layers } from 'lucide-react';
import { useState } from 'react';
import styles from './AdminSidebar.module.css';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
}

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Eventos',
      path: '/admin/events',
      icon: <LayoutDashboard size={20} />,
      isActive: (pathname) => pathname.startsWith('/admin/events'),
    },
    {
      label: 'Salas',
      path: '/admin/rooms',
      icon: <Layers size={20} />,
      isActive: (pathname) => pathname === '/admin/rooms',
    },
  ];

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoSem7}>SEM7</span>
            {!isCollapsed && <span className={styles.logoAdmin}>Admin</span>}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`${styles.navItem} ${
                item.isActive(location.pathname) ? styles.active : ''
              }`}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!isCollapsed && <span className={styles.label}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <div className={`${styles.spacer} ${isCollapsed ? styles.spacerCollapsed : ''}`} />
    </>
  );
}
