import React from 'react';
import styles from './SeatMap.module.css';

interface SeatMapSummaryProps {
  selectedCount: number;
  totalAvailable: number;
  totalSeats: number;
  pricePerSeat: number;
  isLoading?: boolean;
  onContinue: () => void;
  error?: string | null;
}

/**
 * Componente de resumen de selección de asientos
 * Muestra contador, disponibilidad, subtotal y botón continuar
 */
export function SeatMapSummary({
  selectedCount,
  totalAvailable,
  totalSeats,
  pricePerSeat,
  isLoading = false,
  onContinue,
  error = null,
}: SeatMapSummaryProps): React.JSX.Element {
  const totalPrice = selectedCount * pricePerSeat;
  const isValid = selectedCount > 0;

  return (
    <div className={styles.summary}>
      <div className={styles.summaryContent}>
        <div className={styles.availabilityInfo}>
          <p>
            <strong>Disponibles:</strong> {totalAvailable} de {totalSeats} asientos
          </p>
          <p>
            <strong>Seleccionados:</strong> {selectedCount} asiento
            {selectedCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className={styles.priceInfo}>
          <p>
            <strong>Precio unitario:</strong> ${pricePerSeat.toFixed(2)}
          </p>
          <p className={styles.subtotal}>
            <strong>Subtotal:</strong> ${totalPrice.toFixed(2)}
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!isValid && (
          <p className={styles.validationMessage}>
            Selecciona al menos 1 asiento para continuar
          </p>
        )}

        <button
          className={styles.continueButton}
          onClick={onContinue}
          disabled={!isValid || isLoading}
          aria-label="Continue to payment"
        >
          {isLoading ? 'Cargando...' : 'Continuar al pago'}
        </button>
      </div>
    </div>
  );
}
