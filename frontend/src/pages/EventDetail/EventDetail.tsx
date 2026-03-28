import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import { saveTicket } from '../../services/ticketsStorage';
import type { Screen, Order, TicketInfo } from '../../types/flow.types';
import styles from './EventDetail.module.css';

const TIMER_INIT = 599;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
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
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('details');
  const [order, setOrder] = useState<Order | null>(null);
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_INIT);
  const [retryCount, setRetryCount] = useState(0);
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
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify when timer hits zero
  useEffect(() => {
    const transactional = screen === 'checkout' || screen === 'payment' || screen === 'failure';
    if (transactional && timeLeft === 0 && !timerNotifiedRef.current && event) {
      timerNotifiedRef.current = true;
      addNotification('timer_expired', event.title, order?.reservationId);
    }
  }, [timeLeft, screen, event, addNotification, order]);

  // Pause notification polling during transactional screens (RN-NTF-05)
  useEffect(() => {
    const shouldPause = screen === 'checkout' || screen === 'payment' || screen === 'failure';
    setPollingEnabled(!shouldPause);
  }, [screen, setPollingEnabled]);

  const isTransactional = screen === 'checkout' || screen === 'payment' || screen === 'success' || screen === 'failure';
  const showTimer = isTransactional && screen !== 'success';
  const timerString = showTimer ? formatTime(timeLeft) : undefined;

  const handleContinueToPayment = async (email: string) => {
    if (!event || !selectedTierId) return;
    const reservation = await createReservation(event.id, selectedTierId);
    const tier = event.availableTiers.find((t) => t.id === selectedTierId)!;
    const tierPrice = parseFloat(tier.price);
    const quantity = 2;
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

  const handleSimulatePayment = async (type: 'success' | 'failure') => {
    if (!order) return;
    const result = await processPayment(
      order.reservationId,
      order.total,
      type === 'success' ? 'APPROVED' : 'DECLINED',
    );
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
      setScreen('success');
    } else {
      setRetryCount((c) => c + 1);
      if (event) addNotification('payment_rejected', event.title, order.reservationId);
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
              onBack={() => setScreen('details')}
              onContinue={handleContinueToPayment}
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
                      onSelect={setSelectedTierId}
                      onReservar={() => setScreen('checkout')}
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
