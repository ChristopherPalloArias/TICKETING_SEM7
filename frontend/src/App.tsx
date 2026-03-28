import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CarteleraPage from './pages/CarteleraPage/CarteleraPage';
import EventDetail from './pages/EventDetail/EventDetail';
import LoginPage from './pages/admin/LoginPage/LoginPage';
import EventsDashboard from './pages/admin/EventsDashboard/EventsDashboard';
import AdminGuard from './components/admin/AdminGuard/AdminGuard';
import AdminNavBar from './components/admin/AdminNavBar/AdminNavBar';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas del comprador */}
        <Route path="/eventos" element={<CarteleraPage />} />
        <Route path="/eventos/:id" element={<EventDetail />} />
        <Route path="/" element={<Navigate to="/eventos" replace />} />

        {/* Rutas admin — login público */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Rutas admin — protegidas */}
        <Route path="/admin" element={<AdminGuard />}>
          <Route path="events" element={
            <>
              <AdminNavBar />
              <EventsDashboard />
            </>
          } />
          <Route index element={<Navigate to="events" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
