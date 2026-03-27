import styles from './EventGrid.module.css';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = 'No se encontraron eventos que coincidan con tu búsqueda.',
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyMessage}>{message}</p>
    </div>
  );
}
