import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { SeatDTO } from '../services/seatMapService';
import styles from './SeatMapKonva.module.css';

/* ── Layout constants ──────────────────────────────────── */
const SEAT_SIZE   = 36;
const SEAT_GAP    = 5;
const SEAT_STEP   = SEAT_SIZE + SEAT_GAP;
const ROW_W       = 30;   // row label column width
const PADDING     = 20;   // outer padding inside layer
const STAGE_BAND  = 50;   // height of the escenario banner zone
const COL_NUM_H   = 22;   // height of column-number row
const MIN_SCALE   = 0.4;
const MAX_SCALE   = 4;
const SCALE_BY    = 1.12;

/* ── Color palette ─────────────────────────────────────── */
const C = {
  bg:            '#111111',
  available:     '#2B6CB0',
  availableHov:  '#4299E1',
  selected:      '#C05621',
  selectedHov:   '#ED8936',
  reserved:      '#374151',
  reservedStroke:'#4B5563',
  sold:          '#9B2C2C',
  stageFill:     '#FF6B47',
  stageShadow:   'rgba(255,107,71,0.6)',
  rowLabel:      '#718096',
  colNum:        '#4A5568',
  labelText:     '#FFFFFF',
  tooltipBg:     'rgba(10,10,10,0.92)',
  tooltipText:   '#F7FAFC',
  highlight:     'rgba(255,255,255,0.20)',
};

/* ── Props (same contract as old SeatGrid) ─────────────── */
interface SeatMapKonvaProps {
  seats: SeatDTO[];
  selectedSeatIds: string[];
  onSeatClick: (seatId: string) => void;
  disabled?: boolean;
}

/* ── Helpers ───────────────────────────────────────────── */
function rowLabel(row: string): string {
  const n = parseInt(row.replace(/\D/g, ''), 10);
  return isNaN(n) ? row : String(n);
}

function buildRowMap(seats: SeatDTO[]) {
  const map = new Map<string, SeatDTO[]>();
  for (const s of seats) {
    if (!map.has(s.row)) map.set(s.row, []);
    map.get(s.row)!.push(s);
  }
  const sorted = Array.from(map.keys()).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });
  return { map, sorted };
}

/* ══════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════ */
export function SeatMapKonva({
  seats,
  selectedSeatIds,
  onSeatClick,
  disabled = false,
}: SeatMapKonvaProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW]   = useState(600);
  const [layerX, setLayerX]   = useState(0);
  const [layerY, setLayerY]   = useState(0);
  const [scale, setScale]     = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  /* Responsive stage width */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.clientWidth));
    ro.observe(el);
    setStageW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  /* Pre-compute grid */
  const { map: byRow, sorted: rows } = buildRowMap(seats);
  const maxCols  = Math.max(...Array.from(byRow.values()).map(r => r.length), 1);
  const numRows  = rows.length;

  const contentW = PADDING + ROW_W + SEAT_STEP * maxCols + ROW_W + PADDING;
  const contentH = PADDING + STAGE_BAND + COL_NUM_H + SEAT_STEP * numRows + PADDING;
  const stageH   = Math.max(contentH + 10, 250);

  /* Center content when stageW or grid changes */
  useEffect(() => {
    if (stageW === 0 || maxCols === 0) return;
    const initX = Math.max(0, (stageW - contentW) / 2);
    setLayerX(initX);
    setLayerY(0);
    setScale(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageW, maxCols]);

  /* Zoom toward cursor */
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const oldScale = scale;
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * SCALE_BY, MAX_SCALE)
      : Math.max(oldScale / SCALE_BY, MIN_SCALE);
    const anchor = {
      x: (pointer.x - layerX) / oldScale,
      y: (pointer.y - layerY) / oldScale,
    };
    setScale(newScale);
    setLayerX(pointer.x - anchor.x * newScale);
    setLayerY(pointer.y - anchor.y * newScale);
  }, [scale, layerX, layerY]);

  /* Mouse-over tooltip uses clientX/Y so it stays fixed on screen */
  const showTooltip = useCallback((e: KonvaEventObject<MouseEvent>, text: string) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({
      x: e.evt.clientX - rect.left,
      y: e.evt.clientY - rect.top,
      text,
    });
  }, []);

  const updateTooltip = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip(prev => prev ? { ...prev, x: e.evt.clientX - rect.left, y: e.evt.clientY - rect.top } : prev);
  }, []);

  return (
    <div className={styles.wrapper}>
      {/* Canvas container */}
      <div ref={containerRef} className={styles.canvasBox}>
        <Stage
          width={stageW}
          height={stageH}
          onWheel={handleWheel}
          style={{ background: C.bg, display: 'block' }}
        >
          <Layer
            x={layerX}
            y={layerY}
            scaleX={scale}
            scaleY={scale}
            draggable
            onDragEnd={(e) => {
              setLayerX(e.target.x());
              setLayerY(e.target.y());
            }}
          >
            {/* ── Escenario banner ─────────────────────────────── */}
            <Rect
              x={PADDING + ROW_W}
              y={PADDING + 4}
              width={SEAT_STEP * maxCols - SEAT_GAP}
              height={32}
              fill={C.stageFill}
              cornerRadius={[0, 0, 99, 99]}
              shadowColor={C.stageShadow}
              shadowBlur={14}
              shadowOffsetY={4}
            />
            <Text
              x={PADDING + ROW_W}
              y={PADDING + 4}
              width={SEAT_STEP * maxCols - SEAT_GAP}
              height={32}
              text="ESCENARIO"
              fontSize={10}
              fontStyle="bold"
              letterSpacing={3}
              fill={C.labelText}
              align="center"
              verticalAlign="middle"
            />

            {/* ── Column numbers ────────────────────────────────── */}
            {Array.from({ length: maxCols }, (_, i) => (
              <Text
                key={`cn-${i}`}
                x={PADDING + ROW_W + i * SEAT_STEP}
                y={PADDING + STAGE_BAND}
                width={SEAT_SIZE}
                height={COL_NUM_H}
                text={String(i + 1)}
                fontSize={9}
                fill={C.colNum}
                align="center"
                verticalAlign="middle"
              />
            ))}

            {/* ── Rows of seats ─────────────────────────────────── */}
            {rows.map((row, ri) => {
              const rowSeats = (byRow.get(row) ?? []).sort((a, b) => a.number - b.number);
              const seatByNum = new Map(rowSeats.map(s => [s.number, s]));
              const label = rowLabel(row);
              const startY = PADDING + STAGE_BAND + COL_NUM_H + ri * SEAT_STEP;

              return (
                <Group key={row}>
                  {/* Left row label */}
                  <Text
                    x={PADDING}
                    y={startY}
                    width={ROW_W}
                    height={SEAT_SIZE}
                    text={label}
                    fontSize={10}
                    fontStyle="bold"
                    fill={C.rowLabel}
                    align="center"
                    verticalAlign="middle"
                  />

                  {/* Seats */}
                  {Array.from({ length: maxCols }, (_, ci) => {
                    const seat = seatByNum.get(ci + 1);
                    if (!seat) return null;   // gap in row

                    const isSelected  = selectedSeatIds.includes(seat.id);
                    const isHovered   = hoverId === seat.id;
                    const isAvailable = seat.status === 'AVAILABLE';
                    const isClickable = isAvailable && !disabled;

                    let fill: string;
                    if (isSelected)      fill = isHovered ? C.selectedHov : C.selected;
                    else if (!isAvailable) fill = seat.status === 'RESERVED' ? C.reserved : C.sold;
                    else                 fill = isHovered ? C.availableHov : C.available;

                    const sx = PADDING + ROW_W + ci * SEAT_STEP;
                    const tooltipText = `Fila ${label} · Asiento ${seat.number}`;

                    return (
                      <Group
                        key={seat.id}
                        x={sx}
                        y={startY}
                        onClick={isClickable ? () => onSeatClick(seat.id) : undefined}
                        onTap={isClickable ? () => onSeatClick(seat.id) : undefined}
                        onMouseEnter={isClickable ? (e) => {
                          setHoverId(seat.id);
                          showTooltip(e, tooltipText);
                          const stage = e.target.getStage();
                          if (stage) stage.container().style.cursor = 'pointer';
                        } : undefined}
                        onMouseMove={isHovered ? updateTooltip : undefined}
                        onMouseLeave={(e) => {
                          setHoverId(null);
                          setTooltip(null);
                          const stage = e.target.getStage();
                          if (stage) stage.container().style.cursor = 'default';
                        }}
                      >
                        {/* Seat body */}
                        <Rect
                          width={SEAT_SIZE}
                          height={SEAT_SIZE}
                          fill={fill}
                          cornerRadius={isSelected ? 7 : 5}
                          stroke={isHovered || isSelected ? 'rgba(255,255,255,0.35)' : undefined}
                          strokeWidth={isHovered || isSelected ? 1.5 : 0}
                          shadowColor={
                            isSelected
                              ? 'rgba(237,137,54,0.55)'
                              : isHovered
                              ? 'rgba(66,153,225,0.45)'
                              : undefined
                          }
                          shadowBlur={isSelected || isHovered ? 10 : 0}
                        />
                        {/* Backrest highlight strip */}
                        <Rect
                          x={5}
                          y={0}
                          width={SEAT_SIZE - 10}
                          height={5}
                          fill={C.highlight}
                          cornerRadius={[3, 3, 0, 0]}
                        />
                        {/* Seat number */}
                        <Text
                          width={SEAT_SIZE}
                          height={SEAT_SIZE}
                          text={String(seat.number)}
                          fontSize={9}
                          fontStyle="bold"
                          fill={C.labelText}
                          align="center"
                          verticalAlign="middle"
                        />
                      </Group>
                    );
                  })}

                  {/* Right row label */}
                  <Text
                    x={PADDING + ROW_W + maxCols * SEAT_STEP}
                    y={startY}
                    width={ROW_W}
                    height={SEAT_SIZE}
                    text={label}
                    fontSize={10}
                    fontStyle="bold"
                    fill={C.rowLabel}
                    align="center"
                    verticalAlign="middle"
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>

        {/* HTML tooltip overlay — stays fixed regardless of canvas transform */}
        {tooltip && (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
          >
            {tooltip.text}
          </div>
        )}

        {/* Zoom hint */}
        <div className={styles.hint}>Scroll para zoom · Arrastra para mover</div>
      </div>

      {/* ── Legend (HTML, below canvas) ─────────────────────── */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: C.available }} />
          Disponible
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: C.selected }} />
          Seleccionado
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: C.reserved }} />
          Reservado
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: C.sold }} />
          Vendido
        </span>
      </div>
    </div>
  );
}
