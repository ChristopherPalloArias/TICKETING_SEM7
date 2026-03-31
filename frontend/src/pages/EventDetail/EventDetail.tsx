import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import EventHero from '../../components/EventHero/EventHero';
import EventInfoCard from '../../components/EventInfo/EventInfoCard';
import TicketPanel from '../../components/TicketTier/TicketPanel';
import CheckoutScreen from './screens/CheckoutScreen';
import PaymentScreen from './screens/PaymentScreen';
import SuccessScreen from './screens/SuccessScreen';
import FailureScreen from './screens/FailureScreen';
import { useEventDetail } from '../../hooks/useEventDetail';
import { createReservation, processPayment } from '../../services/reservationService';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useCart } from '../../contexts/CartContext';
import { addCartItem } from '../../services/cartService';
import { saveTicket } from '../../services/ticketsStorage';
import QuantitySelector from '../../components/QuantitySelector/QuantitySelector';
import type { Screen, Order, TicketInfo } from '../../types/flow.types';
import type { CartItem } from '../../types/cart.types';
import styles from './EventDetail.module.css';

const TIMER_INIT = 600;

function formatTime(seconds: number): string {
  const clamped = Math.min(Math.max(seconds, 0), TIMER_INIT);
  const m = Math.floor(clamped / 60).toString().padStart(2, '0');
  const s = (clamped % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const screenTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

export default function EventDetail() {
  const { event, loading, error } = useEventDetail();
  const { addNotification, setPollingEnabled } = useNotifications();
  const { removeItem: removeCartItem, items: cartItems, addItem: addCartItemCtx } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const cartState = location.state as { fromCart?: boolean; cartItem?: CartItem } | null;
  const fromCart = cartState?.fromCart === true;
  const cartItem = cartState?.cartItem;

  const [selectedTierId, setSelectedTierId] = useState<string | null>(cartItem?.tierId ?? null);
  const [quantity, setQuantity] = useState(cartItem?.quantity ?? 1);
  const [screen, setScreen] = useState<Screen>(() => fromCart && cartItem ? 'checkout' : 'details');
  const [order, setOrder] = useState<Order | null>(() => {
    if (fromCart && cartItem) {
      const total = cartItem.tierPrice * cartItem.quantity + 10;
      const reference = `#NE-${Math.floor(100000 + Math.random() * 900000)}`;
      return {
        reservationId: cartItem.reservationId,
        eventId: cartItem.eventId,
        tierId: cartItem.tierId,
        tierType: cartItem.tierType,
        tierPrice: cartItem.tierPrice,
        quantity: cartItem.quantity,
        email: cartItem.email ?? '',
        total,
        reference,
      };
    }
    return null;
  });
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (fromCart && cartItem) {
      const ts = cartItem.validUntilAt;
      const utcMs = new Date(ts.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(ts) ? ts : ts + 'Z').getTime();
      const remaining = Math.floor((utcMs - Date.now()) / 1000);
      return Math.min(Math.max(remaining, 0), TIMER_INIT);
    }
    return TIMER_INIT;
  });
  const [retryCount, setRetryCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const timerNotifiedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer: runs only during transactional screens (checkout/payment/failure)
  useEffect(() => {
    const transactional = screen === 'checkout' || screen === 'payment' || screen === 'failure';
    if (transactional && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [screen]); 

  // Notify when timer hits zero
  useEffect(() => {
    const transactional = screen === 'checkout' || screen === 'payment' || screen === 'failure';
    if (transactional && timeLeft === 0 && !timerNotifiedRef.current && event) {
      timerNotifiedRef.current = true;
      addNotification('timer_expired', event.title, order?.reservationId, event.id);
    }
  }, [timeLeft, screen, event, addNotification, order]);

  // Pause notification polling during transactional screens (RN-NTF-05)
  useEffect(() => {
    const shouldPause = screen === 'checkout' || screen === 'payment' || screen === 'failure';
    setPollingEnabled(!shouldPause);
  }, [screen, setPollingEnabled]);

  // Re-enable polling when component unmounts (leaving the transactional flow)
  useEffect(() => {
    return () => setPollingEnabled(true);
  }, [setPollingEnabled]);

  const isTransactional = screen === 'checkout' || screen === 'payment' || screen === 'success' || screen === 'failure';
  const showTimer = isTransactional && screen !== 'success';
  const timerString = showTimer ? formatTime(timeLeft) : undefined;

  const handleContinueToPayment = async (email: string) => {
    if (!event || !selectedTierId) return;
    // If fromCart, reservation already exists — go straight to payment
    if (fromCart && order) {
      setOrder({ ...order, email });
      setScreen('payment');
      return;
    }
    const reservation = await createReservation(event.id, selectedTierId);
    const tier = event.availableTiers.find((t) => t.id === selectedTierId)!;
    const tierPrice = parseFloat(tier.price);
    const total = tierPrice * quantity + 10;
    const reference = `#NE-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrder({
      reservationId: reservation.id,
      eventId: event.id,
      tierId: selectedTierId,
      tierType: tier.tierType,
      tierPrice,
      quantity,
      email,
      total,
      reference,
    });
    setScreen('payment');
  };

  const handleAddToCart = async () => {
    if (!event || !selectedTierId) return;
    const tier = event.availableTiers.find((t) => t.id === selectedTierId);
    if (!tier) return;

    // Validate duplicates before creating reservation
    const duplicate = cartItems.find(
      (i) => i.eventId === event.id && i.tierId === selectedTierId,
    );
    if (duplicate) {
      alert('Ya tienes este tier en tu carrito');
      return;
    }

    // Validate max items
    if (cartItems.length >= 5) {
      alert('Máximo 5 reservas simultáneas permitidas');
      return;
    }

    setAddingToCart(true);
    try {
      const reservation = await createReservation(event.id, selectedTierId);
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventRoom: event.room?.name ?? '',
        eventImageUrl: event.imageUrl ?? '',
        tierId: selectedTierId,
        tierType: tier.tierType,
        tierPrice: parseFloat(tier.price),
        quantity,
        reservationId: reservation.id,
        validUntilAt: reservation.validUntilAt,
        email: '',
        addedAt: new Date().toISOString(),
        expired: false,
        expirationAlerted: false,
      };

      const result = addCartItem(newItem);
      if (result.success) {
        addCartItemCtx(newItem);
        alert('Agregado al carrito');
      } else {
        alert(result.error ?? 'Error al agregar al carrito');
      }
    } catch {
      alert('Error al crear la reserva. Inténtalo nuevamente.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSimulatePayment = async (type: 'success' | 'failure') => {
    if (!order) return;
    let result;
    try {
      result = await processPayment(
        order.reservationId,
        order.total,
        type === 'success' ? 'APPROVED' : 'DECLINED',
      );
    } catch {
      // Backend throws 400 on DECLINED — treat as payment failure
      setRetryCount((c) => c + 1);
      if (event) addNotification('payment_rejected', event.title, order.reservationId, event.id);
      setScreen('failure');
      return;
    }
    if (result.status === 'CONFIRMED' && result.ticket) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const ticketInfo: TicketInfo = {
        ticketId: result.ticket.id,
        reservationId: result.ticket.reservationId,
        eventId: result.ticket.eventId,
        tierId: result.ticket.tierId,
        tierType: result.ticket.tierType,
        price: result.ticket.price,
        status: result.ticket.status,
        createdAt: result.ticket.createdAt,
      };
      setTicket(ticketInfo);
      // Persist to localStorage for My Tickets page
      if (event && order) {
        saveTicket({
          ticket: ticketInfo,
          event: { id: event.id, title: event.title, date: event.date, room: event.room, imageUrl: event.imageUrl },
          tierType: order.tierType,
          quantity: order.quantity,
          total: order.total,
          email: order.email,
          reference: order.reference,
          purchasedAt: new Date().toISOString(),
        });
      }
      // Remove item from cart if coming from cart
      if (fromCart && cartItem) {
        removeCartItem(cartItem.id);
      }
      if (event) addNotification('payment_success', event.title, order.reservationId, event.id);
      setScreen('success');
    } else {
      setRetryCount((c) => c + 1);
      if (event) addNotification('payment_rejected', event.title, order.reservationId, event.id);
      setScreen('failure');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <NavBar activeLink="eventos" isTransactional={false} />
        <div className={styles.skeleton}>
          <div className={styles.skeletonHero} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineSm} />
            <div className={styles.skeletonLineSm} />
          </div>
        </div>
        <BottomNav activeTab="catalog" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.page}>
        <NavBar activeLink="eventos" isTransactional={false} />
        <div className={styles.errorState}>
          <h1 className={styles.errorTitle}>Evento no disponible</h1>
          <p className={styles.errorMessage}>{error ?? 'No se pudo cargar el evento.'}</p>
          <Link to="/eventos" className={styles.backLink}>
            ← Volver a la Cartelera
          </Link>
        </div>
        <BottomNav activeTab="catalog" />
      </div>
    );
  }

  const selectedTier = selectedTierId ? event.availableTiers.find((t) => t.id === selectedTierId) : null;

  return (
    <div className={styles.page}>
      <NavBar
        activeLink="eventos"
        isTransactional={isTransactional}
        timeLeft={timerString}
      />

      <AnimatePresence mode="wait">
        {screen === 'checkout' && selectedTier && (
          <motion.div
            key="checkout"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className={styles.screenWrapper}
          >
            <CheckoutScreen
              event={event}
              tier={selectedTier}
              quantity={quantity}
              onBack={fromCart ? () => navigate('/carrito') : () => setScreen('details')}
              onContinue={handleContinueToPayment}
              initialEmail={fromCart && cartItem ? cartItem.email : undefined}
            />
          </motion.div>
        )}

        {screen === 'payment' && order && (
          <motion.div
            key="payment"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className={styles.screenWrapper}
          >
            <PaymentScreen
              event={event}
              order={order}
              onSimulate={handleSimulatePayment}
            />
          </motion.div>
        )}

        {screen === 'success' && ticket && order && (
          <motion.div
            key="success"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className={styles.screenWrapper}
          >
            <SuccessScreen
              event={event}
              ticket={ticket}
              order={order}
              onBackToCatalog={() => setScreen('catalog')}
            />
          </motion.div>
        )}

        {screen === 'failure' && order && (
          <motion.div
            key="failure"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className={styles.screenWrapper}
          >
            <FailureScreen
              event={event}
              order={order}
              timeLeft={formatTime(timeLeft)}
              retryCount={retryCount}
              timerExpired={timeLeft <= 0}
              onRetry={() => setScreen('payment')}
              onChangeMethod={() => setScreen('checkout')}
            />
          </motion.div>
        )}

        {(screen === 'details' || screen === 'catalog') && (
          <motion.div
            key="details"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenTransition}
            className={styles.screenWrapper}
          >
            <EventHero event={event} />

            <main className={styles.main}>
              <div className={styles.layout}>
                {/* Left column: info */}
                <div className={styles.infoColumn}>
                  {/* Synopsis section */}
                  <motion.section
                    className={styles.synopsis}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <h2 className={styles.sectionLabel}>La Obra</h2>
                    <p className={styles.synopsisText}>{event.description}</p>
                  </motion.section>

                  {/* Director / Cast cards */}
                  {(event.director || event.cast) && (
                    <motion.div
                      className={styles.artGrid}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      {event.director && (
                        <EventInfoCard label="DIRECTOR" value={event.director} />
                      )}
                      {event.cast && (
                        <EventInfoCard label="ELENCO" value={event.cast} />
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Right column: sticky ticket panel */}
                <div className={styles.panelColumn}>
                  <div className={styles.stickyWrapper}>
                    <TicketPanel
                      tiers={event.availableTiers}
                      selectedTierId={selectedTierId}
                      onSelect={(tierId) => {
                        setSelectedTierId(tierId);
                        setQuantity(1);
                      }}
                      onReservar={() => setScreen('checkout')}
                      onAddToCart={handleAddToCart}
                      addingToCart={addingToCart}
                      quantitySelector={
                        selectedTier && (
                          <QuantitySelector
                            value={quantity}
                            min={1}
                            max={selectedTier.quota}
                            onChange={setQuantity}
                          />
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={screen as string} />
    </div>
  );
}
