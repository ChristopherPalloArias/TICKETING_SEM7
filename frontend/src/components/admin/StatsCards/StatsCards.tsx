import { BarChart3, CheckCircle, ShoppingCart, Clock } from 'lucide-react';
import type { AdminStatsResponse } from '../../../services/adminEventService';
import styles from './StatsCards.module.css';

interface StatsCardsProps {
  stats: AdminStatsResponse | null;
  loading?: boolean;
}

export default function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Eventos',
      value: stats?.totalEvents ?? 0,
      icon: BarChart3,
      color: 'blue',
    },
    {
      label: 'Eventos Publicados',
      value: stats?.publishedEvents ?? 0,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Tickets Vendidos',
      value: stats?.totalTicketsSold ?? 0,
      icon: ShoppingCart,
      color: 'purple',
    },
    {
      label: 'Reservas Activas',
      value: stats?.activeReservations ?? 0,
      icon: Clock,
      color: 'orange',
    },
  ];

  return (
    <div className={styles.container}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`${styles.card} ${styles[`card${card.color}`]}`}>
            <div className={styles.iconBox}>
              <Icon size={24} />
            </div>
            <div className={styles.content}>
              <p className={styles.label}>{card.label}</p>
              <p className={styles.value}>{card.value.toLocaleString('es-ES')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
