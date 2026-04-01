import { useState } from 'react';
import type { AdminEventResponse, AdminTierResponse } from '../../../types/admin.types';
import styles from './EventDetailTabs.module.css';

interface EventDetailTabsProps {
  event: AdminEventResponse;
  tiers: AdminTierResponse[];
  onTierAdded?: () => void;
  onTierDeleted?: (tierId: string) => void;
  children?: React.ReactNode;
}

type TabType = 'info' | 'tiers' | 'reservations' | 'metrics';

export default function EventDetailTabs({
  event,
  tiers,
  children,
}: EventDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'info', label: 'Información' },
    { id: 'tiers', label: 'Tiers' },
    { id: 'reservations', label: 'Reservas' },
    { id: 'metrics', label: 'Métricas' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'info' && (
          <div className={styles.tabPane}>
            <h3>Información General del Evento</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Título</label>
                <p>{event.title}</p>
              </div>
              {event.subtitle && (
                <div className={styles.infoItem}>
                  <label>Subtítulo</label>
                  <p>{event.subtitle}</p>
                </div>
              )}
              <div className={styles.infoItem}>
                <label>Descripción</label>
                <p>{event.description || 'No disponible'}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Fecha y Hora</label>
                <p>{new Date(event.date).toLocaleString('es-ES')}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Sala</label>
                <p>{event.room?.name || 'No asignada'}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Aforo</label>
                <p>{event.capacity} personas</p>
              </div>
              <div className={styles.infoItem}>
                <label>Estado</label>
                <p>{event.status}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className={styles.tabPane}>
            <h3>Configuración de Tiers</h3>
            <div className={styles.tiersList}>
              {tiers.length === 0 ? (
                <p className={styles.emptyMsg}>No hay tiers configurados</p>
              ) : (
                tiers.map((tier) => (
                  <div key={tier.id} className={styles.tierItem}>
                    <div>
                      <strong>{tier.tierType}</strong>
                      <span className={styles.tierBadge}>${tier.price}</span>
                    </div>
                    <p>Cupo: {tier.quota}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className={styles.tabPane}>
            <h3>Reservas Activas</h3>
            <p className={styles.emptyMsg}>Reservas: (función en desarrollo)</p>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className={styles.tabPane}>
            <h3>Métricas del Evento</h3>
            <p className={styles.emptyMsg}>Métricas: (función en desarrollo)</p>
          </div>
        )}
      </div>

      {children && <div className={styles.childrenArea}>{children}</div>}
    </div>
  );
}
