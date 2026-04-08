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
  onSeatLabelsChange?: (labels: string[]) => void;
  onContinueToPayment?: () => void;
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
  onSeatLabelsChange,
  onContinueToPayment,
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

  const [uiError, setUiError] = useState<string | null>(null);

  // Notificar cambios de selección al padre
  useEffect(() => {
    onSeatSelectionChange(selectedSeatIds);
    if (onSeatLabelsChange) {
      const labels = selectedSeatIds.map((id) => {
        const seat = seats.find((s) => s.id === id);
        return seat ? `${seat.row}${seat.number}` : id;
      });
      onSeatLabelsChange(labels);
    }
  }, [selectedSeatIds, onSeatSelectionChange, onSeatLabelsChange, seats]);

  // Manejar errores de API
  useEffect(() => {
    if (!apiError) return;
    // Use a microtask to avoid setState cascades inside the effect body
    const id = setTimeout(() => {
      setUiError(apiError);
      onError?.(apiError);
    }, 0);
    return () => clearTimeout(id);
  }, [apiError, onError]);

  const handleContinue = () => {
    if (selectedSeatIds.length === 0) {
      setUiError('Selecciona al menos 1 asiento para continuar');
      return;
    }
    if (onContinueToPayment) {
      onContinueToPayment();
    }
  };

  const handleRefresh = () => {
    refetch();
    setUiError(null);
  };

  return (
    <div className={styles.seatMapContainer} data-testid="seatmap-container">
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

      {!isLoading && totalSeats === 0 && (
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
