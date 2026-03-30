import styles from './QuantitySelector.module.css';

interface QuantitySelectorProps {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}

export default function QuantitySelector({ value, min, max, onChange }: QuantitySelectorProps) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Cantidad</span>
      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          type="button"
          aria-label="Disminuir cantidad"
        >
          −
        </button>
        <span className={styles.display}>{value}</span>
        <button
          className={styles.btn}
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          type="button"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>
    </div>
  );
}
