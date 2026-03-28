import { Link } from 'react-router-dom';
import type { BreadcrumbsProps } from '../../../types/admin.types';
import styles from './Breadcrumbs.module.css';

export default function Breadcrumbs({ segments }: BreadcrumbsProps) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={seg.path + idx} className={styles.segment}>
            {isLast ? (
              <span className={styles.current}>{seg.label}</span>
            ) : (
              <Link to={seg.path} className={styles.link}>
                {seg.label}
              </Link>
            )}
            {!isLast && <span className={styles.separator}>&gt;</span>}
          </span>
        );
      })}
    </nav>
  );
}
