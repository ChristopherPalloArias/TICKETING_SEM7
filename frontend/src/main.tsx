import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { CartProvider } from './contexts/CartContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationsProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </NotificationsProvider>
    </AuthProvider>
  </StrictMode>,
)
