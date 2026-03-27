import styles from './EventTagBadge.module.css';

interface EventTagBadgeProps {
  tag: string;
  variant: 'filled' | 'outlined';
}

export default function EventTagBadge({ tag, variant }: EventTagBadgeProps) {
  return (
    <span className={`${styles.badge} ${variant === 'filled' ? styles.filled : styles.outlined}`}>
      {tag}
    </span>
  );
}
