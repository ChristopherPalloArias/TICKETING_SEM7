import { Outlet } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import AdminNavBar from '../AdminNavBar/AdminNavBar';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import { AdminProvider } from '../../../contexts/AdminContext';
import { useBreadcrumbs } from '../../../hooks/admin/useBreadcrumbs';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { segments } = useBreadcrumbs();

  return (
    <AdminProvider>
      <div className={styles.container}>
        <AdminSidebar />
        <div className={styles.mainContent}>
          <AdminNavBar />
          <Breadcrumbs segments={segments} />
          <div className={styles.outlet}>
            <Outlet />
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}
