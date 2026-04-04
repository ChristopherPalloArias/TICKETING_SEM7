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

  // Ordenar filas numéricamente ("Row-1" < "Row-2" < "Row-10")
  const sortedRows = Array.from(seatsByRow.keys()).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  // Máximo de asientos en cualquier fila → define columnas del grid
  const maxSeatsInRow = Math.max(
    ...Array.from(seatsByRow.values()).map((s) => s.length)
  );

  // Extraer número de fila para etiqueta legible
  const rowLabel = (row: string) => {
    const n = parseInt(row.replace(/\D/g, ''), 10);
    return isNaN(n) ? row : String(n);
  };

  return (
    <div className={styles.gridWrapper}>
      {/* Escenario */}
      <div className={styles.stage}>
        <span>ESCENARIO</span>
      </div>

      {/* Leyenda de números de columna */}
      <div className={styles.columnNumbers} style={{ '--cols': maxSeatsInRow } as React.CSSProperties}>
        <div className={styles.rowLabelSpacer} />
        {Array.from({ length: maxSeatsInRow }, (_, i) => (
          <div key={i} className={styles.colNumber}>{i + 1}</div>
        ))}
        <div className={styles.rowLabelSpacer} />
      </div>

      {/* Filas de asientos */}
      <div className={styles.gridContainer}>
        {sortedRows.map((row) => {
          const rowSeats = (seatsByRow.get(row) ?? []).sort((a, b) => a.number - b.number);
          // Construir mapa por número de asiento para detectar huecos
          const seatByNum = new Map(rowSeats.map((s) => [s.number, s]));

          return (
            <div key={row} className={styles.gridRow}>
              {/* Etiqueta izquierda */}
              <div className={styles.rowLabel}>{rowLabel(row)}</div>

              {/* Celdas del grid (posiciones 1..maxSeatsInRow) */}
              <div
                className={styles.grid}
                style={{ '--cols': maxSeatsInRow } as React.CSSProperties}
              >
                {Array.from({ length: maxSeatsInRow }, (_, i) => {
                  const seat = seatByNum.get(i + 1);
                  return seat ? (
                    <SeatItem
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeatIds.includes(seat.id)}
                      onClick={() => onSeatClick(seat.id)}
                      disabled={disabled}
                    />
                  ) : (
                    <div key={`empty-${i}`} className={styles.seatEmpty} />
                  );
                })}
              </div>

              {/* Etiqueta derecha */}
              <div className={styles.rowLabel}>{rowLabel(row)}</div>
            </div>
          );
        })}
      </div>

      {/* Leyenda de estados */}
      <div className={styles.legendContainer}>
        <div className={styles.legend}>
          <div className={`${styles.legendItem} ${styles.seatAvailable}`} />
          <span>Disponible</span>
        </div>
        <div className={styles.legend}>
          <div className={`${styles.legendItem} ${styles.seatSelected}`} />
          <span>Seleccionado</span>
        </div>
        <div className={styles.legend}>
          <div className={`${styles.legendItem} ${styles.seatReserved}`} />
          <span>Reservado</span>
        </div>
        <div className={styles.legend}>
          <div className={`${styles.legendItem} ${styles.seatSold}`} />
          <span>Vendido</span>
        </div>
      </div>
    </div>
  );
}
