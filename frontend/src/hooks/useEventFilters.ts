import { useState, useMemo } from 'react';
import type { EventResponse, EventViewModel, TierType } from '../types/event.types';

export type DateFilterOption = 'all' | 'this-week' | 'this-month' | 'next-3-months';

interface UseEventFiltersResult {
  filteredEvents: EventViewModel[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  tierFilter: TierType | 'all';
  setTierFilter: (t: TierType | 'all') => void;
  dateFilter: DateFilterOption;
  setDateFilter: (d: DateFilterOption) => void;
}

function getDateRange(filter: DateFilterOption): { from: Date; to: Date } | null {
  if (filter === 'all') return null;
  const now = new Date();
  const to = new Date();
  if (filter === 'this-week') {
    to.setDate(now.getDate() + 7);
  } else if (filter === 'this-month') {
    to.setMonth(now.getMonth() + 1);
  } else if (filter === 'next-3-months') {
    to.setMonth(now.getMonth() + 3);
  }
  return { from: now, to };
}

function toViewModel(event: EventResponse): EventViewModel {
  const displayStatus = event.availableTiers.some((t) => t.isAvailable)
    ? 'DISPONIBLE'
    : 'AGOTADO';

  const availablePrices = event.availableTiers
    .filter((t) => t.isAvailable)
    .map((t) => parseFloat(t.price));

  const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : null;

  return { ...event, displayStatus, minPrice };
}

export function useEventFilters(events: EventResponse[]): UseEventFiltersResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');

  const filteredEvents = useMemo<EventViewModel[]>(() => {
    const range = getDateRange(dateFilter);

    return events
      .filter((event) => {
        const matchesSearch = event.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        const matchesTier =
          tierFilter === 'all' ||
          event.availableTiers.some(
            (t) => t.tierType === tierFilter && t.isAvailable
          );

        const matchesDate =
          range === null ||
          (() => {
            const eventDate = new Date(event.date);
            return eventDate >= range.from && eventDate <= range.to;
          })();

        return matchesSearch && matchesTier && matchesDate;
      })
      .map(toViewModel);
  }, [events, searchQuery, tierFilter, dateFilter]);

  return {
    filteredEvents,
    searchQuery,
    setSearchQuery,
    tierFilter,
    setTierFilter,
    dateFilter,
    setDateFilter,
  };
}
