import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, ArrowRight } from 'lucide-react';
import NavBar from '../../components/NavBar/NavBar';
import BottomNav from '../../components/NavBar/BottomNav';
import { getPublicRooms } from '../../services/venueService';
import { getEvents } from '../../services/eventService';
import type { RoomResponse, EventResponse } from '../../types/event.types';
import styles from './VenuesPage.module.css';

// Descriptive data augmentation keyed by room name (stable across restarts)
const VENUE_META: Record<string, { city: string; description: string; imageHue: number }> = {
  'Teatro Real': {
    city: 'Madrid, España',
    description:
      'Icónico coliseo del siglo XIX en el corazón de Madrid. Sede de las producciones más ambiciosas de ópera y teatro contemporáneo en la Península.',
    imageHue: 30,
  },
  'Grand Opera House': {
    city: 'Londres, Reino Unido',
    description:
      'Sala de referencia para la ópera alternativa y el teatro experimental. Famosa por su acústica perfecta y su arquitectura neogótica rehabilitada.',
    imageHue: 200,
  },
  'The Velvet Lounge': {
    city: 'Nueva York, EE. UU.',
    description:
      'Espacio íntimo y atmosférico diseñado para experiencias de jazz y música en vivo en formato reducido. Cada noche es única.',
    imageHue: 280,
  },
  'Arts Center': {
    city: 'Chicago, EE. UU.',
    description:
      'Centro multidisciplinar que alberga danza contemporánea, performance y teatro físico. Pionero en la integración de arte y tecnología.',
    imageHue: 140,
  },
};

interface VenueWithEvents extends RoomResponse {
  events: EventResponse[];
}

async function fetchVenuesWithEvents(): Promise<VenueWithEvents[]> {
  const [rooms, eventsData] = await Promise.all([
    getPublicRooms(),
    getEvents({ pageSize: 50 }),
  ]);

  return rooms.map((room) => ({
    ...room,
    events: eventsData.events.filter((e) => e.room.id === room.id),
  }));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVenuesWithEvents()
      .then(setVenues)
      .catch(() => setError('No se pudieron cargar los venues. Intenta de nuevo más tarde.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <NavBar activeLink="venues" isTransactional={false} />

      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>Venues</h1>
          <p className={styles.heroSubtitle}>
            Los escenarios más destacados de nuestra temporada. Espacios únicos donde el arte toma vida.
          </p>
        </header>

        {loading && (
          <div className={styles.skeletonGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p className={styles.errorMsg}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className={styles.grid}>
            {venues.map((venue) => {
              const meta = VENUE_META[venue.name] ?? { city: 'Ubicación', description: '', imageHue: 0 };
              return (
                <article key={venue.id} className={styles.card}>
                  <div
                    className={styles.cardVisual}
                    style={{ '--hue': meta.imageHue } as React.CSSProperties}
                  >
                    <div className={styles.cardGradient} />
                    <span className={styles.cardCapacityBadge}>
                      <Users size={12} />
                      {venue.maxCapacity.toLocaleString()} capacity
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <MapPin size={12} className={styles.pin} />
                      <span className={styles.cardCity}>{meta.city}</span>
                    </div>
                    <h2 className={styles.cardName}>{venue.name}</h2>
                    <p className={styles.cardDesc}>{meta.description}</p>

                    {venue.events.length > 0 && (
                      <div className={styles.upcoming}>
                        <p className={styles.upcomingLabel}>
                          <Calendar size={11} />
                          Próximas funciones
                        </p>
                        <ul className={styles.eventList}>
                          {venue.events.map((ev) => (
                            <li key={ev.id}>
                              <Link to={`/eventos/${ev.id}`} className={styles.eventLink}>
                                <span className={styles.eventTitle}>{ev.title}</span>
                                <span className={styles.eventDate}>{formatDate(ev.date)}</span>
                                <ArrowRight size={12} className={styles.eventArrow} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {venue.events.length === 0 && (
                      <p className={styles.noEvents}>Sin funciones programadas</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav activeTab="venues" />
    </div>
  );
}
