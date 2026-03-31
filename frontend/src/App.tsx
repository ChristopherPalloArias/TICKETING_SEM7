import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CarteleraPage from './pages/CarteleraPage/CarteleraPage';
import EventDetail from './pages/EventDetail/EventDetail';
import VenuesPage from './pages/VenuesPage/VenuesPage';
import MyTicketsPage from './pages/MyTicketsPage/MyTicketsPage';
import CartPage from './pages/CartPage/CartPage';
import LoginPage from './pages/admin/LoginPage/LoginPage';
import EventsDashboard from './pages/admin/EventsDashboard/EventsDashboard';
import CreateEventPage from './pages/admin/CreateEventPage/CreateEventPage';
import EventDetailAdmin from './pages/admin/EventDetailAdmin/EventDetailAdmin';
import AdminGuard from './components/admin/AdminGuard/AdminGuard';
import AdminLayout from './components/admin/AdminLayout/AdminLayout';
import { useCartExpirationWatcher } from './hooks/useCartExpirationWatcher';
import './styles/global.css';

function CartExpirationWatcher() {
  useCartExpirationWatcher();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartExpirationWatcher />
      <Routes>
        {/* Rutas públicas del comprador */}
        <Route path="/eventos" element={<CarteleraPage />} />
        <Route path="/eventos/:id" element={<EventDetail />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/mis-tickets" element={<MyTicketsPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/" element={<Navigate to="/eventos" replace />} />

        {/* Rutas admin — login público */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Rutas admin — protegidas */}
        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="events" element={<EventsDashboard />} />
            <Route path="events/new" element={<CreateEventPage />} />
            <Route path="events/:id" element={<EventDetailAdmin />} />
          </Route>
          <Route index element={<Navigate to="events" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
