import styles from './EventGrid.module.css';

interface ErrorStateProps {
  message?: string;
}

export default function ErrorState({
  message = 'No se pudieron cargar los eventos. Intenta de nuevo más tarde.',
}: ErrorStateProps) {
  return (
    <div className={styles.errorState}>
      <p className={styles.errorMessage}>{message}</p>
    </div>
  );
}
