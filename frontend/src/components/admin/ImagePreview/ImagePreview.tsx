import type { ImagePreviewProps } from '../../../types/admin.types';
import styles from './ImagePreview.module.css';

export default function ImagePreview({ url }: ImagePreviewProps) {
  if (!url) return null;

  return (
    <div className={styles.container}>
      <img
        src={url}
        alt="Preview"
        className={styles.image}
        onError={e => {
          (e.currentTarget as HTMLImageElement).src = '';
          (e.currentTarget as HTMLImageElement).classList.add(styles.broken);
        }}
      />
    </div>
  );
}
