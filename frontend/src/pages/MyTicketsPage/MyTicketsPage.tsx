import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowRight } from 'lucide-react';
import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import TicketCard from '../../components/Ticket/TicketCard';
import { useMyTickets } from '../../hooks/useMyTickets';
import { showToast } from '../../utils/toast';
import styles from './MyTicketsPage.module.css';

export default function MyTicketsPage() {
  const { tickets, loading, error, page, totalPages, setPage } = useMyTickets();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const aTime = new Date(a.purchasedAt).getTime();
      const bTime = new Date(b.purchasedAt).getTime();
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }, [tickets, sortOrder]);

  if (error && !loading) {
    showToast(error, 'error');
  }

  return (
    <div className={styles.page}>
      <NavBar activeLink="tickets" isTransactional={false} />

      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>Mis Tickets</h1>
          <p className={styles.heroSubtitle}>
            Tus entradas confirmadas
          </p>
        </header>

        {loading ? (
          <div className={styles.loadingState}>
            <Ticket size={48} className={styles.loadingIcon} />
            <p className={styles.loadingMsg}>Cargando tickets...</p>
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <div className={styles.empty}>
            <Ticket size={48} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Aún no tienes tickets</p>
            <p className={styles.emptyHint}>
              Una vez que completes una compra, tus entradas aparecerán aquí.
            </p>
            <Link to="/eventos" className={styles.browseBtn}>
              Explorar cartelera
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.controls}>
              <select
                className={styles.sortSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguos primero</option>
              </select>
            </div>

            <div className={styles.list}>
              {sortedTickets.map((ticket) => (
                <TicketCard key={ticket.ticketId} ticket={ticket} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className={styles.paginationBtn}
                >
                  ← Anterior
                </button>
                <span className={styles.pageInfo}>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className={styles.paginationBtn}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav activeTab="tickets" />
    </div>
  );
}
