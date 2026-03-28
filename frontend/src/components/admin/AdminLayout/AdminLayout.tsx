import { Outlet } from 'react-router-dom';
import AdminNavBar from '../AdminNavBar/AdminNavBar';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import { useBreadcrumbs } from '../../../hooks/admin/useBreadcrumbs';

export default function AdminLayout() {
  const { segments } = useBreadcrumbs();

  return (
    <>
      <AdminNavBar />
      <Breadcrumbs segments={segments} />
      <Outlet />
    </>
  );
}
