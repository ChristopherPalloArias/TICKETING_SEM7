import { motion } from 'framer-motion';
import styles from './LoadMoreButton.module.css';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading: boolean;
}

export default function LoadMoreButton({ onClick, loading }: LoadMoreButtonProps) {
  return (
    <div className={styles.wrapper}>
      <motion.button
        className={styles.btn}
        onClick={onClick}
        disabled={loading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {loading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Loading...
          </>
        ) : (
          'Load More Performances'
        )}
      </motion.button>
    </div>
  );
}
