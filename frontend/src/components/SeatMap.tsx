import { useEffect, useState } from 'react';
import React from 'react';
import styles from './SeatMap.module.css';
import { useSeatSelection } from '../hooks/useSeatSelection';
import { useSeatMapAPI } from '../hooks/useSeatMapAPI';
import { SeatGrid } from './SeatGrid';
import { SeatMapSummary } from './SeatMapSummary';

interface SeatMapProps {
  eventId: string;
  tierId: string;
  tierPrice: number;
  tierType: string;
  token: string | null;
  onSeatSelectionChange: (selectedSeatIds: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

/**
 * Componente principal de selección de asientos
 * Integra grid de asientos, hooks de selección y resumen
 * Maneja fallback a modo cuota si no hay asientos disponibles
 */
export function SeatMap({
  eventId,
  tierId,
  tierPrice,
  tierType,
  token,
  onSeatSelectionChange,
  onError,
  disabled = false,
}: SeatMapProps): React.JSX.Element {
  const { selectedSeatIds, toggleSeat, getSelectedCount } =
    useSeatSelection();
  const {
    seats,
    isLoading,
    error: apiError,
    refetch,
    totalAvailable,
    totalSeats,
  } = useSeatMapAPI(eventId, tierId, token);

  const [fallbackToQuota, setFallbackToQuota] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  // Si no hay asientos, entrar en modo cuota (backward compatibility)
  useEffect(() => {
    if (!isLoading && totalSeats === 0) {
      setFallbackToQuota(true);
      onError?.('No seats available for this tier. Using quota mode.');
    } else if (totalSeats > 0) {
      setFallbackToQuota(false);
    }
  }, [totalSeats, isLoading, onError]);

  // Notificar cambios de selección al padre
  useEffect(() => {
    onSeatSelectionChange(selectedSeatIds);
  }, [selectedSeatIds, onSeatSelectionChange]);

  // Manejar errores de API
  useEffect(() => {
    if (apiError && !fallbackToQuota) {
      setUiError(apiError);
      onError?.(apiError);
    }
  }, [apiError, fallbackToQuota, onError]);

  const handleContinue = () => {
    if (selectedSeatIds.length === 0) {
      setUiError('Please select at least one seat');
      return;
    }
    // El padre (EventDetail) manejará el flujo de pago
  };

  const handleRefresh = () => {
    refetch();
    setUiError(null);
  };

  // Modo cuota: fallback si no hay asientos
  if (fallbackToQuota) {
    return (
      <div className={styles.seatMapContainer}>
        <div className={styles.quotaFallback}>
          <h3>Seleciona la cantidad de entradas</h3>
          <p>Este evento usa modalidad de cuota (no tiene asientos específicos)</p>
          {/* El padre (EventDetail) mostrará el selector de cantidad */}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.seatMapContainer}>
      <div className={styles.header}>
        <h2>Selecciona tus asientos</h2>
        <p>
          Tier: <strong>{tierType}</strong> | Precio: <strong>${tierPrice.toFixed(2)}</strong>
        </p>
      </div>

      {isLoading && (
        <div className={styles.loading}>
          <p>Cargando asientos disponibles...</p>
        </div>
      )}

      {uiError && (
        <div className={styles.errorBanner}>
          <p>⚠️ {uiError}</p>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && totalSeats > 0 && (
        <>
          <div className={styles.gridSection}>
            <SeatGrid
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onSeatClick={toggleSeat}
              disabled={disabled}
            />
          </div>

          <SeatMapSummary
            selectedCount={getSelectedCount()}
            totalAvailable={totalAvailable}
            totalSeats={totalSeats}
            pricePerSeat={tierPrice}
            isLoading={isLoading}
            onContinue={handleContinue}
            error={uiError}
          />
        </>
      )}

      {!isLoading && totalSeats === 0 && !fallbackToQuota && (
        <div className={styles.noSeatsMessage}>
          <p>No hay asientos disponibles para este tier en este momento.</p>
          <button onClick={handleRefresh} className={styles.refreshButton}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
