import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import FilterBar from '../../components/FilterBar/FilterBar';
import EventGrid from '../../components/EventGrid/EventGrid';
import HeroCarousel from '../../components/HeroCarousel/HeroCarousel';
import { useEvents } from '../../hooks/useEvents';
import { useEventFilters } from '../../hooks/useEventFilters';
import styles from './CarteleraPage.module.css';

export default function CarteleraPage() {
  const { events, loading, loadingMore, error, hasMore, loadMore } = useEvents();
  const {
    filteredEvents,
    searchQuery,
    setSearchQuery,
    tierFilter,
    setTierFilter,
    dateFilter,
    setDateFilter,
  } = useEventFilters(events);

  return (
    <div className={styles.page}>
      <NavBar activeLink="eventos" isTransactional={false} />

      {/* HeroCarousel: todos los eventos, edge-to-edge */}
      {!loading && filteredEvents.length > 0 && (
        <HeroCarousel events={filteredEvents} />
      )}

      <main className={styles.main}>
        <section className={styles.filters}>
          <FilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            tierFilter={tierFilter}
            onTierChange={setTierFilter}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
          />
        </section>

        <EventGrid
          events={filteredEvents}
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
