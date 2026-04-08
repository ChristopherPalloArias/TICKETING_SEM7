import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import EventGrid from '../../components/EventGrid/EventGrid';
import HeroCarousel from '../../components/HeroCarousel/HeroCarousel';
import { useEvents } from '../../hooks/useEvents';
import styles from './CarteleraPage.module.css';

export default function CarteleraPage() {
  const { events, loading, loadingMore, error, hasMore, loadMore } = useEvents();

  return (
    <div className={styles.page}>
      <NavBar activeLink="eventos" isTransactional={false} />

      {/* HeroCarousel: todos los eventos, edge-to-edge */}
      {!loading && events.length > 0 && (
        <HeroCarousel events={events as any} />
      )}

      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <h2>En tendencia por Ticketing</h2>
          <p>No te pierdas estos grandes eventos, ¡conoce cuáles están por llegar!</p>
        </div>
        <EventGrid
          events={events as any}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerLogo}>SEM7</span>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Privacidad</a>
            <a href="#" className={styles.footerLink}>Términos</a>
            <a href="#" className={styles.footerLink}>Contacto</a>
          </div>
          <span className={styles.footerCopy}>© 2026 SEM7 ENTERTAINMENT</span>
        </div>
      </footer>

      <BottomNav activeTab="catalog" />
    </div>
  );
}
