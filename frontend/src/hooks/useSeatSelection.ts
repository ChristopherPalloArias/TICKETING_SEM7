import { useState, useCallback } from 'react';

const MAX_SEATS = 100;
const MIN_SEATS = 1;

interface UseSeatSelectionReturn {
  selectedSeatIds: string[];
  toggleSeat: (seatId: string) => void;
  clearSelection: () => void;
  isSelected: (seatId: string) => boolean;
  getTotalPrice: (pricePerSeat: number) => number;
  canAddMore: () => boolean;
  getSelectedCount: () => number;
  isValidSelection: () => boolean;
  reset: () => void;
}

/**
 * Hook para manejar el estado de selección de asientos
 * Valida límites (1 a 100 asientos)
 * Calcula el precio total
 */
export function useSeatSelection(): UseSeatSelectionReturn {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  const toggleSeat = useCallback(
    (seatId: string) => {
      setSelectedSeatIds((prev) => {
        const isSelected = prev.includes(seatId);

        if (isSelected) {
          // Deseleccionar
          return prev.filter((id) => id !== seatId);
        } else {
          // Seleccionar si no se excede el límite
          if (prev.length < MAX_SEATS) {
            return [...prev, seatId];
          }
          return prev;
        }
      });
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedSeatIds([]);
  }, []);

  const isSelected = useCallback(
    (seatId: string) => selectedSeatIds.includes(seatId),
    [selectedSeatIds]
  );

  const getTotalPrice = useCallback(
    (pricePerSeat: number) => {
      return selectedSeatIds.length * pricePerSeat;
    },
    [selectedSeatIds]
  );

  const canAddMore = useCallback(() => {
    return selectedSeatIds.length < MAX_SEATS;
  }, [selectedSeatIds]);

  const getSelectedCount = useCallback(
    () => selectedSeatIds.length,
    [selectedSeatIds]
  );

  const isValidSelection = useCallback(() => {
    return (
      selectedSeatIds.length >= MIN_SEATS && selectedSeatIds.length <= MAX_SEATS
    );
  }, [selectedSeatIds]);

  const reset = useCallback(() => {
    setSelectedSeatIds([]);
  }, []);

  return {
    selectedSeatIds,
    toggleSeat,
    clearSelection,
    isSelected,
    getTotalPrice,
    canAddMore,
    getSelectedCount,
    isValidSelection,
    reset,
  };
}
