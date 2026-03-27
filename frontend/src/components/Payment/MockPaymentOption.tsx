import { CheckCircle2, XCircle } from 'lucide-react';
import styles from './MockPaymentOption.module.css';

interface MockPaymentOptionProps {
  type: 'success' | 'failure';
  onClick: () => void;
  loading: boolean;
}

export default function MockPaymentOption({ type, onClick, loading }: MockPaymentOptionProps) {
  const isSuccess = type === 'success';

  return (
    <button
      className={`${styles.card} ${isSuccess ? styles.cardSuccess : styles.cardFailure}`}
      onClick={onClick}
      disabled={loading}
      type="button"
    >
      <div className={`${styles.iconWrap} ${isSuccess ? styles.iconWrapSuccess : styles.iconWrapFailure}`}>
        {isSuccess ? (
          <CheckCircle2 size={40} className={styles.iconSuccess} />
        ) : (
          <XCircle size={40} className={styles.iconFailure} />
        )}
      </div>
      <h3 className={styles.title}>
        {loading ? 'Procesando...' : isSuccess ? 'Simular Pago Exitoso' : 'Simular Pago Rechazado'}
      </h3>
      <p className={styles.desc}>
        {isSuccess
          ? 'El pago será aprobado y se generará tu ticket digital.'
          : 'El pago será declinado. Podrás reintentar con la misma reserva.'}
      </p>
    </button>
  );
}
