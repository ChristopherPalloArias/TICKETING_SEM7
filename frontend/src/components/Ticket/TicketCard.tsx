import { Tag, Calendar, Download } from 'lucide-react';
import type { MyTicketResponse } from '../../services/ticketService';
import { downloadTicketPdf } from '../../services/ticketService';
import { showToast } from '../../utils/toast';
import styles from './TicketCard.module.css';

interface TicketCardProps {
  ticket: MyTicketResponse;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const isValid = ticket.status === 'VALID';

  async function handleDownloadPdf() {
    try {
      const blob = await downloadTicketPdf(ticket.ticketId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${ticket.ticketId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Ticket descargado', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al descargar ticket';
      showToast(message, 'error');
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.eventTitle}>{ticket.eventTitle}</h3>
        <span className={`${styles.statusBadge} ${styles[`status${ticket.status}`]}`}>
          {ticket.status === 'VALID' ? 'Válido' : 'Cancelado'}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Calendar size={14} />
            {formatDate(ticket.eventDate)}
            <span className={styles.time}>{formatTime(ticket.eventDate)}</span>
          </span>
        </div>

        <div className={styles.tierAndPrice}>
          <span className={`${styles.tierBadge} ${styles[`tier${ticket.tier}`]}`}>
            <Tag size={12} />
            {ticket.tier}
          </span>
          <span className={styles.price}>${ticket.pricePaid.toLocaleString('es-ES')}</span>
        </div>

        <div className={styles.ticketId}>
          <small>ID: {ticket.ticketId}</small>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.purchasedAt}>
          Comprado: {new Date(ticket.purchasedAt).toLocaleDateString('es-ES')}
        </span>
        <button
          className={`${styles.downloadBtn} ${!isValid ? styles.disabled : ''}`}
          onClick={handleDownloadPdf}
          disabled={!isValid}
          aria-label="Descargar ticket en PDF"
        >
          <Download size={16} />
          Descargar
        </button>
      </div>

      {!isValid && (
        <div className={styles.cancelledOverlay}>
          Este ticket fue cancelado
        </div>
      )}
    </article>
  );
}
