import styles from './EventGrid.module.css';

interface LoadingSkeletonsProps {
  count?: number;
}

export default function LoadingSkeletons({ count = 6 }: LoadingSkeletonsProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeleton}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonMeta} />
          <div className={styles.skeletonBtn} />
        </div>
      ))}
    </>
  );
}
