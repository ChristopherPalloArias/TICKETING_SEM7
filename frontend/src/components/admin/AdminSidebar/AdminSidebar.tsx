import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Layers } from 'lucide-react';
import { useAdmin } from '../../../contexts/AdminContext';
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
  const { isSidebarCollapsed, setSidebarCollapsed } = useAdmin();

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
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoSem7}>SEM7</span>
            {!isSidebarCollapsed && <span className={styles.logoAdmin}>Admin</span>}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expandir' : 'Contraer'}
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
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!isSidebarCollapsed && <span className={styles.label}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <div className={`${styles.spacer} ${isSidebarCollapsed ? styles.spacerCollapsed : ''}`} />
    </>
  );
}
