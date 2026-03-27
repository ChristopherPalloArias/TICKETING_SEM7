import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CarteleraPage from './pages/CarteleraPage/CarteleraPage';
import EventDetail from './pages/EventDetail/EventDetail';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/eventos" element={<CarteleraPage />} />
        <Route path="/eventos/:id" element={<EventDetail />} />
        <Route path="/" element={<Navigate to="/eventos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
