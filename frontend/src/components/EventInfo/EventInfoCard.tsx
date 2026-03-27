import styles from './EventInfo.module.css';

interface EventInfoCardProps {
  label: string;
  value: string;
}

export default function EventInfoCard({ label, value }: EventInfoCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value || '—'}</span>
    </div>
  );
}
