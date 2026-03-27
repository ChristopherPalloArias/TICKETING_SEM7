import { Link } from 'react-router-dom';
import styles from './MobileMenu.module.css';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}>
      <div className={styles.links}>
        <Link to="/eventos" className={styles.link} onClick={onClose}>
          EVENTOS
        </Link>
        <a href="#" className={styles.link} onClick={onClose}>VENUES</a>
        <a href="#" className={styles.link} onClick={onClose}>MY TICKETS</a>
      </div>
    </div>
  );
}
