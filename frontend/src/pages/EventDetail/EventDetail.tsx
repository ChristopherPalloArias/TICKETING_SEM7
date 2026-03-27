import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import EventHero from '../../components/EventHero/EventHero';
import EventInfoCard from '../../components/EventInfo/EventInfoCard';
import TicketPanel from '../../components/TicketTier/TicketPanel';
import { useEventDetail } from '../../hooks/useEventDetail';
import styles from './EventDetail.module.css';

type ScreenState = 'detail' | 'checkout';

export default function EventDetail() {
  const { event, loading, error } = useEventDetail();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [screen, setScreen] = useState<ScreenState>('detail');

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

  if (screen === 'checkout') {
    // Placeholder for checkout screen — SPEC-checkout-pago-frontend
    const selected = event.availableTiers.find((t) => t.id === selectedTierId);
    return (
      <div className={styles.page}>
        <NavBar activeLink="eventos" isTransactional={true} />
        <div className={styles.checkoutPlaceholder}>
          <h2 className={styles.checkoutTitle}>Finalizar Reserva</h2>
          <p className={styles.checkoutInfo}>{event.title}</p>
          {selected && (
            <p className={styles.checkoutInfo}>
              Tier: {selected.tierType} — ${parseFloat(selected.price).toLocaleString()}
            </p>
          )}
          <button
            className={styles.backBtn}
            onClick={() => setScreen('detail')}
            type="button"
          >
            ← Volver al detalle
          </button>
        </div>
        <BottomNav activeTab="checkout" />
      </div>
    );
  }

  const activeBottomTab = 'catalog';

  return (
    <div className={styles.page}>
      <NavBar activeLink="eventos" isTransactional={false} />

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

      <BottomNav activeTab={activeBottomTab} />
    </div>
  );
}
