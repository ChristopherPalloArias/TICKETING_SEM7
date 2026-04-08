import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import OrderSummary from '../../../components/Checkout/OrderSummary';
import PaymentPanel from '../../../components/Checkout/PaymentPanel';
import { useAuth } from '../../../hooks/useAuth';
import type { EventResponse, TierResponse } from '../../../types/event.types';
import styles from './CheckoutScreen.module.css';

interface CheckoutScreenProps {
  event: EventResponse;
  tier: TierResponse;
  quantity: number;
  onBack: () => void;
  onContinue: (email: string) => Promise<void>;
  initialEmail?: string;
  seatLabels?: string[];
  enableSeats?: boolean;
}

export default function CheckoutScreen({ event, tier, quantity, onBack, onContinue, initialEmail, seatLabels, enableSeats }: CheckoutScreenProps) {
  const { email: authEmail } = useAuth();
  const [email, setEmail] = useState(initialEmail ?? authEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReadOnly = !!authEmail;
  const emailError = !isReadOnly && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? 'Ingresa un correo válido (ej: nombre@dominio.com)'
    : null;

  const handleContinue = async () => {
    if (!email || emailError) return;
    setLoading(true);
    setError(null);
    try {
      await onContinue(email);
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === 'object' &&
        'response' in err &&
        err.response !== null &&
        typeof err.response === 'object' &&
        'status' in err.response
      ) {
        const status = (err.response as { status: number }).status;
        if (status === 409) setError('No hay cupo disponible para este tier.');
        else if (status === 404) setError('Evento o tier no encontrado.');
        else setError('Error al crear la reserva. Inténtalo nuevamente.');
      } else {
        setError('Error al crear la reserva. Inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tierPrice = parseFloat(tier.price);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back button */}
        <button className={styles.backBtn} onClick={onBack} type="button">
          <ChevronLeft size={18} />
          <span>Volver al evento</span>
        </button>

        <h1 className={styles.heading}>Finalizar Reserva</h1>

        <div className={styles.layout}>
          {/* Left column */}
          <div className={styles.leftCol}>
            <OrderSummary event={event} tier={tier} quantity={quantity} seatLabels={seatLabels} enableSeats={enableSeats} />

            {/* Email section */}
            <div className={styles.emailSection}>
              <h2 className={styles.sectionTitle}>Información del Comprador</h2>
              <label className={styles.emailLabel} htmlFor="checkout-email">
                Correo Electrónico
              </label>
              <input
                id="checkout-email"
                type="email"
                className={isReadOnly ? styles.inputReadOnly : styles.emailInput}
                placeholder="tu@email.com"
                value={email}
                readOnly={isReadOnly}
                onChange={!isReadOnly ? (e) => setEmail(e.target.value) : undefined}
                autoComplete="email"
              />
              {emailError && <span className={styles.fieldError}>{emailError}</span>}
              <p className={styles.emailHint}>
                Enviaremos tus e-tickets y el código QR de acceso a esta dirección inmediatamente después del pago.
              </p>
            </div>
          </div>

          {/* Right column — sticky panel */}
          <div className={styles.rightCol}>
            <PaymentPanel
              tierName={tier.tierType}
              tierPrice={tierPrice}
              quantity={quantity}
              email={email}
              onContinue={handleContinue}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
