import type { EventResponse } from '../../types/event.types';
import type { Order, TicketInfo } from '../../types/flow.types';
import styles from './DigitalTicket.module.css';

interface DigitalTicketProps {
  event: EventResponse;
  ticket: TicketInfo;
  order: Order;
}

export default function DigitalTicket({ event, ticket, order }: DigitalTicketProps) {
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = eventDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  const ticketDisplayId = `${order.reference}-X9`;

  const seatDisplay = order.enableSeats && order.seatLabels && order.seatLabels.length > 0
    ? order.seatLabels.join(', ')
    : null;

  return (
    <div className={styles.ticket}>
      {/* Image section */}
      <div className={styles.imageSection}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
        <div className={styles.imageGradient} />
        <div className={styles.imageOverlay}>
          <span className={styles.badge}>Confirmado</span>
          <h2 className={styles.eventTitle}>{event.title.toUpperCase()}</h2>
        </div>
      </div>

      {/* Body section */}
      <div className={styles.body}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>FECHA</span>
            <span className={styles.infoValue}>{dateStr}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>HORA</span>
            <span className={styles.infoValue}>{timeStr}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>VENUE</span>
            <span className={styles.infoValue}>{event.room?.name ?? 'Main Stage'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{order.enableSeats ? 'ASIENTOS' : 'TICKETS'}</span>
            <span className={styles.infoValue}>
              {seatDisplay ?? `${order.quantity} ticket${order.quantity !== 1 ? 's' : ''} — Sin silletería`}
            </span>
          </div>
        </div>

        <div className={styles.seatBadge}>
          {order.tierType}{seatDisplay ? ` — ${seatDisplay}` : ''}
        </div>
      </div>

      {/* Perforated divider */}
      <div className={styles.perforationRow}>
        <div className={styles.cutoutLeft} />
        <div className={styles.dashedLine} />
        <div className={styles.cutoutRight} />
      </div>

      {/* QR / Access section */}
      <div className={styles.accessSection}>
        <div className={styles.qrPlaceholder}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="76" height="76" rx="4" stroke="#3A3A3A" strokeWidth="4" />
            <rect x="10" y="10" width="24" height="24" rx="2" fill="#3A3A3A" />
            <rect x="14" y="14" width="16" height="16" rx="1" fill="#E5E2E1" />
            <rect x="46" y="10" width="24" height="24" rx="2" fill="#3A3A3A" />
            <rect x="50" y="14" width="16" height="16" rx="1" fill="#E5E2E1" />
            <rect x="10" y="46" width="24" height="24" rx="2" fill="#3A3A3A" />
            <rect x="14" y="50" width="16" height="16" rx="1" fill="#E5E2E1" />
            <rect x="46" y="46" width="8" height="8" fill="#3A3A3A" />
            <rect x="58" y="46" width="8" height="8" fill="#3A3A3A" />
            <rect x="46" y="58" width="8" height="8" fill="#3A3A3A" />
            <rect x="58" y="58" width="8" height="8" fill="#3A3A3A" />
          </svg>
        </div>
        <div className={styles.ticketIdSection}>
          <span className={styles.ticketIdLabel}>ID DE TICKET</span>
          <span className={styles.ticketId}>{ticketDisplayId}</span>
          <span className={styles.ticketStatus}>{ticket.status}</span>
        </div>
      </div>
    </div>
  );
}
