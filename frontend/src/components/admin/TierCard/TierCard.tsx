import { Trash2 } from 'lucide-react';
import type { TierCardProps } from '../../../types/admin.types';
import styles from './TierCard.module.css';

const TIER_LABELS: Record<string, string> = {
  VIP: 'VIP',
  GENERAL: 'General',
  EARLY_BIRD: 'Early Bird',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function TierCard({ tier, isDraft, onDelete }: TierCardProps) {
  const badgeClass =
    tier.tierType === 'VIP'
      ? styles.badgeVip
      : tier.tierType === 'EARLY_BIRD'
      ? styles.badgeEarlyBird
      : styles.badgeGeneral;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${badgeClass}`}>
          {TIER_LABELS[tier.tierType] ?? tier.tierType}
        </span>
        {isDraft && (
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(tier.id)}
            aria-label={`Eliminar tier ${TIER_LABELS[tier.tierType]}`}
          >
            <Trash2 size={15} />
            <span>Eliminar</span>
          </button>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Precio</span>
          <span className={styles.detailValue}>{formatPrice(tier.price)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Cupo</span>
          <span className={styles.detailValue}>{tier.quota} entradas</span>
        </div>
        {tier.tierType === 'EARLY_BIRD' && tier.validFrom && tier.validUntil && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Vigencia</span>
            <span className={styles.detailValue}>
              {formatDate(tier.validFrom)} – {formatDate(tier.validUntil)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
