import React from 'react';
import type { SeatDTO } from '../services/seatMapService';
import styles from './SeatMap.module.css';

interface SeatItemProps {
  seat: SeatDTO;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Componente individual de un asiento
 * Muestra estado visual (AVAILABLE, RESERVED, SOLD, SELECTED)
 * Permite click para seleccionar si está disponible
 */
export function SeatItem({
  seat,
  isSelected,
  onClick,
  disabled = false,
}: SeatItemProps): React.JSX.Element {
  const getStatusClass = (): string => {
    if (isSelected) {
      return styles.seatSelected;
    }

    switch (seat.status) {
      case 'AVAILABLE':
        return styles.seatAvailable;
      case 'RESERVED':
        return styles.seatReserved;
      case 'SOLD':
        return styles.seatSold;
      default:
        return styles.seatAvailable;
    }
  };

  const isClickable = seat.status === 'AVAILABLE' && !disabled;

  return (
    <button
      className={`${styles.seat} ${getStatusClass()} ${
        isClickable ? styles.seatHover : ''
      }`}
      onClick={onClick}
      disabled={!isClickable}
      title={`Fila ${seat.row.replace(/\D/g, '')} - Asiento ${seat.number} (${seat.status})`}
      aria-label={`Asiento ${seat.row}-${seat.number} - ${seat.status}`}
    >
      <span className={styles.seatLabel}>{seat.number}</span>
    </button>
  );
}
