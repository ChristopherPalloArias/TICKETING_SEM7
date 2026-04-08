import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { TierResponse } from '../../types/event.types';
import TicketTier from './TicketTier';
import styles from './TicketPanel.module.css';

interface TicketPanelProps {
  tiers: TierResponse[];
  selectedTierId: string | null;
  onSelect: (tierId: string) => void;
  onReservar: () => void;
  quantitySelector?: React.ReactNode;
  enableSeats?: boolean;
}

export default function TicketPanel({
  tiers,
  selectedTierId,
  onSelect,
  onReservar,
  quantitySelector,
  enableSeats,
}: TicketPanelProps) {
  const hasAvailable = tiers.some((t) => t.isAvailable);

  useEffect(() => {
    if (selectedTierId === null) {
      const first = tiers.find((t) => t.isAvailable);
      if (first) {
        onSelect(first.id);
      }
    }
  }, [tiers, selectedTierId, onSelect]);

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Selecciona tu Entrada</h2>

      {hasAvailable ? (
        <div className={styles.tierList}>
          {tiers.map((tier) => (
            <TicketTier
              key={tier.id}
              tier={tier}
              selected={selectedTierId === tier.id}
              onClick={() => onSelect(tier.id)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.noAvailability}>Sin disponibilidad para este evento.</p>
      )}

      {quantitySelector}

      {!enableSeats && (
        <motion.button
          data-testid="reserve-tier-btn"
          className={`${styles.cta} ${!selectedTierId ? styles.ctaDisabled : ''}`}
          disabled={!selectedTierId}
          onClick={selectedTierId ? onReservar : undefined}
          whileHover={selectedTierId ? { scale: 1.02 } : undefined}
          whileTap={selectedTierId ? { scale: 0.98 } : undefined}
          transition={{ duration: 0.15 }}
          type="button"
        >
          <span>Reservar</span>
          <ArrowRight size={18} />
        </motion.button>
      )}

      <p className={styles.refund}>
        Garantía de reembolso hasta 48h antes
      </p>
    </div>
  );
}
