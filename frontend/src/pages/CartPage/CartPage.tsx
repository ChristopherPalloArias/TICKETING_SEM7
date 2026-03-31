import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import CartItemCard from '../../components/Cart/CartItemCard';
import CartSummary from '../../components/Cart/CartSummary';
import { useCart } from '../../contexts/CartContext';
import { createReservation } from '../../services/reservationService';
import type { CartItem } from '../../types/cart.types';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { items, removeItem, updateItem } = useCart();
  const navigate = useNavigate();
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const handlePay = (item: CartItem) => {
    navigate(`/eventos/${item.eventId}`, {
      state: {
        fromCart: true,
        cartItem: item,
      },
    });
  };

  const handleRemove = (itemId: string) => {
    removeItem(itemId);
  };

  const handleRenew = async (item: CartItem) => {
    setRenewingId(item.id);
    try {
      const reservation = await createReservation(item.eventId, item.tierId);
      updateItem(item.id, {
        reservationId: reservation.id,
        validUntilAt: reservation.validUntilAt,
        expired: false,
        expirationAlerted: false,
      });
    } catch {
      alert('No se pudo renovar la reserva. Inténtalo nuevamente.');
    } finally {
      setRenewingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <NavBar activeLink="eventos" />
        <div className={styles.emptyState}>
          <ShoppingCart size={64} className={styles.emptyIcon} />
          <h1 className={styles.emptyTitle}>Tu carrito está vacío</h1>
          <p className={styles.emptyText}>
            Agrega entradas desde la cartelera para comenzar tu experiencia teatral.
          </p>
          <Link to="/eventos" className={styles.exploreCta}>
            Explorar cartelera
          </Link>
        </div>
        <BottomNav activeTab="catalog" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar activeLink="eventos" />

      <main className={styles.main}>
        <h1 className={styles.heading}>Mi Carrito</h1>

        <div className={styles.layout}>
          <div className={styles.itemsColumn}>
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onPay={handlePay}
                onRemove={handleRemove}
                onRenew={handleRenew}
              />
            ))}
            {renewingId && (
              <p className={styles.renewingMsg}>Renovando reserva…</p>
            )}
          </div>

          <div className={styles.summaryColumn}>
            <div className={styles.stickyWrapper}>
              <CartSummary items={items} />
              <Link to="/mis-tickets" className={styles.ticketsLink}>
                Ver Mis Tickets
              </Link>
            </div>
          </div>
        </div>
      </main>

      <BottomNav activeTab="catalog" />
    </div>
  );
}
