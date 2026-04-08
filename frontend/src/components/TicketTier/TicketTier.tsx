import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { TierResponse } from '../../types/event.types';
import styles from './TicketTier.module.css';

interface TicketTierProps {
  tier: TierResponse;
  selected: boolean;
  onClick: () => void;
}

const TIER_LABELS: Record<string, string> = {
  VIP: 'VIP',
  GENERAL: 'General',
  EARLY_BIRD: 'Early Bird',
};

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return isNaN(num) ? price : `$${num.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
}

export default function TicketTier({ tier, selected, onClick }: TicketTierProps) {
  const disabled = !tier.isAvailable;

  const cardClass = [
    styles.card,
    selected ? styles.selected : '',
    disabled ? styles.disabled : styles.available,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      data-testid={`tier-${tier.tierType}`}
      className={cardClass}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      role="button"
      aria-pressed={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
    >
      <div className={styles.header}>
        <div className={styles.nameRow}>
          <span className={styles.tierName}>{TIER_LABELS[tier.tierType] ?? tier.tierType}</span>
          {(tier as TierResponse & { tag?: string }).tag && (
            <span className={styles.tierBadge}>
              {(tier as TierResponse & { tag?: string }).tag!.toUpperCase()}
            </span>
          )}
        </div>
        {selected && <CheckCircle2 size={20} className={styles.checkIcon} />}
        {disabled && <span className={styles.soldOut}>AGOTADO</span>}
      </div>

      {tier.tierType === 'VIP' && (
        <p className={styles.description}>Acceso preferente, mejor vista garantizada.</p>
      )}
      {tier.tierType === 'GENERAL' && (
        <p className={styles.description}>Entrada estándar con excelente ubicación.</p>
      )}
      {tier.tierType === 'EARLY_BIRD' && (
        <p className={styles.description}>Precio especial por compra anticipada.</p>
      )}

      <span className={`${styles.price} ${disabled ? styles.priceStrike : ''} ${selected ? styles.priceSelected : ''}`}>
        {formatPrice(tier.price)}
      </span>
    </motion.div>
  );
}
