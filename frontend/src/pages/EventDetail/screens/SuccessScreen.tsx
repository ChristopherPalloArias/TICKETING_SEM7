import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Download } from 'lucide-react';
import DigitalTicket from '../../../components/Ticket/DigitalTicket';
import { printElement } from '../../../utils/printTicket';
import type { EventResponse } from '../../../types/event.types';
import type { Order, TicketInfo } from '../../../types/flow.types';
import styles from './SuccessScreen.module.css';

interface SuccessScreenProps {
  event: EventResponse;
  ticket: TicketInfo;
  order: Order;
  onBackToCatalog: () => void;
}

export default function SuccessScreen({ event, ticket, order, onBackToCatalog }: SuccessScreenProps) {
  const navigate = useNavigate();
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleBackToCatalog = () => {
    onBackToCatalog();
    navigate('/eventos');
  };

  const handleDownload = () => {
    if (ticketRef.current) {
      printElement(ticketRef.current, `Ticket — ${event.title}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <CheckCircle2 size={40} className={styles.checkIcon} />
          </div>
          <h1 data-testid="success-title" className={styles.title}>¡Pago aprobado!</h1>
          <p className={styles.subtitle}>Tu lugar está asegurado para una noche inolvidable.</p>
        </div>

        {/* Digital ticket */}
        <div ref={ticketRef}>
          <DigitalTicket event={event} ticket={ticket} order={order} />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.downloadBtn} type="button" onClick={handleDownload}>
            <Download size={18} />
            <span>Descargar Ticket</span>
          </button>
          <button data-testid="success-catalog-btn" className={styles.catalogBtn} onClick={handleBackToCatalog} type="button">
            Volver al Catálogo
          </button>
        </div>
      </div>
    </div>
  );
}
