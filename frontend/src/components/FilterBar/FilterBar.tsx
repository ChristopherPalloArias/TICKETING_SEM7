import FilterDropdown from './FilterDropdown';
import type { TierType } from '../../types/event.types';
import type { DateFilterOption } from '../../hooks/useEventFilters';
import styles from './FilterBar.module.css';

const TIER_OPTIONS = [
  { value: 'VIP', label: 'VIP' },
  { value: 'GENERAL', label: 'GENERAL' },
  { value: 'EARLY_BIRD', label: 'EARLY BIRD' },
];

const DATE_OPTIONS = [
  { value: 'this-week', label: 'Esta semana' },
  { value: 'this-month', label: 'Este mes' },
  { value: 'next-3-months', label: 'Próximos 3 meses' },
];

interface FilterBarProps {
  searchQuery: string;
  onSearch: (q: string) => void;
  tierFilter: TierType | 'all';
  onTierChange: (t: TierType | 'all') => void;
  dateFilter: DateFilterOption;
  onDateChange: (d: DateFilterOption) => void;
}

export default function FilterBar({
  searchQuery,
  onSearch,
  tierFilter,
  onTierChange,
  dateFilter,
  onDateChange,
}: FilterBarProps) {
  return (
    <section className={styles.bar} aria-label="Filtros de búsqueda">
      <div className={styles.searchWrapper}>
        <svg
          className={styles.searchIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar evento..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Buscar evento por nombre"
        />
      </div>

      <div className={styles.dropdowns}>
        <FilterDropdown
          label="TIER"
          options={TIER_OPTIONS}
          value={tierFilter}
          onChange={(v) => onTierChange(v as TierType | 'all')}
        />
        <FilterDropdown
          label="FECHA"
          options={DATE_OPTIONS}
          value={dateFilter}
          onChange={(v) => onDateChange(v as DateFilterOption)}
        />
      </div>
    </section>
  );
}
