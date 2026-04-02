import React from 'react';
import type { SeatDTO } from '../services/seatMapService';
import styles from './SeatMap.module.css';
import { SeatItem } from './SeatItem';

interface SeatGridProps {
  seats: SeatDTO[];
  selectedSeatIds: string[];
  onSeatClick: (seatId: string) => void;
  disabled?: boolean;
}

/**
 * Componente de grid de asientos
 * Organiza los asientos en filas y columnas
 * Delega renderizado individual a SeatItem
 */
export function SeatGrid({
  seats,
  selectedSeatIds,
  onSeatClick,
  disabled = false,
}: SeatGridProps): React.JSX.Element {
  // Agrupar asientos por fila
  const seatsByRow = new Map<string, SeatDTO[]>();
  seats.forEach((seat) => {
    if (!seatsByRow.has(seat.row)) {
      seatsByRow.set(seat.row, []);
    }
    seatsByRow.get(seat.row)!.push(seat);
  });

  // Ordenar filas alfabéticamente
  const sortedRows = Array.from(seatsByRow.keys()).sort();

  return (
    <div className={styles.gridContainer}>
      {sortedRows.map((row) => (
        <div key={row} className={styles.gridRow}>
          <div className={styles.rowLabel}>{row}</div>
          <div className={styles.grid}>
            {seatsByRow.get(row)?.map((seat) => (
              <SeatItem
                key={seat.id}
                seat={seat}
                isSelected={selectedSeatIds.includes(seat.id)}
                onClick={() => onSeatClick(seat.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
