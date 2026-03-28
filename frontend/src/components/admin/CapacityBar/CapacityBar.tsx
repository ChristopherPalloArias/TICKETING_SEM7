import type { CapacityBarProps } from '../../../types/admin.types';
import styles from './CapacityBar.module.css';

export default function CapacityBar({ assignedQuota, totalCapacity }: CapacityBarProps) {
  const pct = totalCapacity > 0 ? (assignedQuota / totalCapacity) * 100 : 0;
  const clampedPct = Math.min(pct, 100);

  const colorClass =
    pct > 100
      ? styles.red
      : pct >= 80
      ? styles.yellow
      : styles.green;

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        <span className={styles.label}>Cupo asignado</span>
        <span className={styles.count}>
          {assignedQuota} / {totalCapacity} asignados
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${colorClass}`}
          style={{ width: `${clampedPct}%` }}
          role="progressbar"
          aria-valuenow={assignedQuota}
          aria-valuemin={0}
          aria-valuemax={totalCapacity}
        />
      </div>
    </div>
  );
}
