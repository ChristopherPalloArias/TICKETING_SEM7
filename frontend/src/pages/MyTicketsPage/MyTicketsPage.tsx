import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, MapPin, Calendar, Tag, ArrowRight } from 'lucide-react';
import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import { getTickets } from '../../services/ticketsStorage';
import type { StoredTicket } from '../../services/ticketsStorage';
import styles from './MyTicketsPage.module.css';

const TIER_LABELS: Record<string, string> = {
  GENERAL: 'General',
  VIP: 'VIP',
  EARLY_BIRD: 'Early Bird',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

function TicketCard({ entry }: { entry: StoredTicket }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardLeft}>
        <div
          className={styles.thumb}
          style={{
            backgroundImage: entry.event.imageUrl ? `url(${entry.event.imageUrl})` : undefined,
          }}
        />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={`${styles.tierBadge} ${styles[`tier${entry.tierType}`]}`}>
            <Tag size={10} />
            {TIER_LABELS[entry.tierType] ?? entry.tierType}
          </span>
          <span className={styles.reference}>{entry.reference}</span>
        </div>

        <h2 className={styles.eventTitle}>{entry.event.title}</h2>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Calendar size={11} />
            {formatDate(entry.event.date)}
          </span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>
            <MapPin size={11} />
            {entry.event.room.name}
          </span>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <span className={styles.qty}>{entry.quantity} entrada{entry.quantity > 1 ? 's' : ''}</span>
            <span className={styles.total}>${entry.total.toFixed(2)}</span>
          </div>
          <Link to={`/eventos/${entry.event.id}`} className={styles.viewBtn}>
            Ver evento
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MyTicketsPage() {
  const [tickets] = useState<StoredTicket[]>(() => getTickets());

  return (
    <div className={styles.page}>
      <NavBar activeLink="tickets" isTransactional={false} />

      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>Mis Tickets</h1>
          <p className={styles.heroSubtitle}>
            Tus entradas confirmadas de esta sesión.
          </p>
        </header>

        {tickets.length === 0 ? (
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
          <div className={styles.list}>
            {tickets.map((entry) => (
              <TicketCard key={entry.ticket.ticketId} entry={entry} />
            ))}
          </div>
        )}
      </main>

      <BottomNav activeTab="tickets" />
    </div>
  );
}
