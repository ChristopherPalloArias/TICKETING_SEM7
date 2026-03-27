import { CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import styles from './PaymentPanel.module.css';

interface PaymentPanelProps {
  tierName: string;
  tierPrice: number;
  quantity: number;
  email: string;
  onContinue: () => void;
  loading: boolean;
  error?: string | null;
}

const SERVICE_FEE = 10;

export default function PaymentPanel({
  tierName,
  tierPrice,
  quantity,
  email,
  onContinue,
  loading,
  error,
}: PaymentPanelProps) {
  const subtotal = tierPrice * quantity;
  const total = subtotal + SERVICE_FEE;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className={styles.panel}>
      {/* Security badges */}
      <div className={styles.securityRow}>
        <CreditCard size={14} className={styles.securityIcon} />
        <ShieldCheck size={14} className={styles.securityIcon} />
        <CheckCircle2 size={14} className={styles.securityIcon} />
        <span className={styles.securityText}>PAGO SEGURO ENCRIPTADO</span>
      </div>

      <div className={styles.divider} />

      {/* Price breakdown */}
      <div className={styles.breakdown}>
        <div className={styles.lineItem}>
          <span>{quantity}x {tierName}</span>
          <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={styles.lineItem}>
          <span>Service Fee</span>
          <span>${SERVICE_FEE.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>TOTAL</span>
        <span className={styles.totalValue}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>

      {/* Error message */}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* CTA */}
      <button
        className={styles.ctaBtn}
        onClick={onContinue}
        disabled={!isEmailValid || loading}
        type="button"
      >
        {loading ? 'Procesando...' : 'Continuar al Pago'}
      </button>
    </div>
  );
}
