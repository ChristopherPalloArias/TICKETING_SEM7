import type { RoomOption } from '../../../types/admin.types';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: RoomOption;
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h3 className={styles.name}>{room.name}</h3>
        <p className={styles.capacity}>
          Capacidad: <span className={styles.value}>{room.maxCapacity} lugares</span>
        </p>
        <p className={styles.id}>
          ID: <code className={styles.idValue}>{room.id}</code>
        </p>
      </div>
    </div>
  );
}
