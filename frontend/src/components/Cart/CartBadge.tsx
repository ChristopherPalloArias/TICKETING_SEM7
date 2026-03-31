import styles from './CartBadge.module.css';

interface CartBadgeProps {
  count: number;
}

export default function CartBadge({ count }: CartBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className={styles.badge}>
      {count > 9 ? '9+' : count}
    </span>
  );
}
