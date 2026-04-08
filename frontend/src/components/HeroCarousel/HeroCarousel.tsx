import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ChevronRight, ChevronLeft, Ticket } from 'lucide-react';
import type { EventViewModel } from '../../types/event.types';
import styles from './HeroCarousel.module.css';

interface HeroCarouselProps {
  events: EventViewModel[];
}

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22400%22 height%3D%22560%22 viewBox%3D%220 0 400 560%22%3E%3Crect width%3D%22400%22 height%3D%22560%22 fill%3D%22%23242424%22%2F%3E%3C%2Fsvg%3E';

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function HeroCarousel({ events }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((index: number) => {
    if (animating) return;
    setAnimating(true);
    setActiveIndex(index);
    setTimeout(() => setAnimating(false), 500);
  }, [animating]);

  const prev = () => goTo((activeIndex - 1 + events.length) % events.length);
  const next = () => goTo((activeIndex + 1) % events.length);

  // Auto-advance every 6s
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % events.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [events.length]);

  if (!events || events.length === 0) return null;

  const active = events[activeIndex];
  const nextIndex = (activeIndex + 1) % events.length;
  const nextNext = (activeIndex + 2) % events.length;

  return (
    <section className={styles.section} data-testid="hero-carousel">
      {/* Background blur from active image */}
      <div
        className={styles.bgBlur}
        style={{ backgroundImage: `url(${active.imageUrl ?? PLACEHOLDER})` }}
      />
      <div className={styles.bgOverlay} />

      <div className={styles.inner}>
        {/* LEFT — Texto del evento activo */}
        <div className={styles.leftCol}>
          {active.tag && (
            <span className={styles.tag}>{active.tag}</span>
          )}
          <h1
            key={`title-${activeIndex}`}
            className={`${styles.title} ${animating ? styles.fadeIn : ''}`}
            data-testid="hero-event-title"
          >
            {active.title}
          </h1>

          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <MapPin size={14} />
              <span>{active.room?.name}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={14} />
              <span>{formatDate(active.date)}</span>
            </div>
          </div>

          {active.minPrice !== null && (
            <p className={styles.priceLabel}>
              Desde <strong>${active.minPrice}</strong>
            </p>
          )}

          <div className={styles.actions}>
            <Link
              to={`/eventos/${active.id}`}
              id="hero-buy-btn"
              data-testid="hero-buy-btn"
              className={styles.btnPrimary}
            >
              <Ticket size={16} />
              Comprar ahora
            </Link>
            <Link
              to={`/eventos/${active.id}`}
              data-testid="hero-detail-btn"
              className={styles.btnSecondary}
            >
              Ver detalle
            </Link>
          </div>

          {/* Dots de navegación */}
          {events.length > 1 && (
            <div className={styles.dots}>
              {events.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Ir al evento ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CENTER + RIGHT — Pósters en carrusel */}
        <div className={styles.postersArea}>
          {/* Poster activo */}
          <div
            className={`${styles.posterMain} ${animating ? styles.fadeIn : ''}`}
            key={`poster-${activeIndex}`}
          >
            <Link to={`/eventos/${active.id}`} data-testid={`hero-poster-${activeIndex}`}>
              <img
                src={active.imageUrl ?? PLACEHOLDER}
                alt={active.title}
                className={styles.posterImg}
              />
            </Link>
          </div>

          {/* Siguientes posters (asomando) */}
          {events.length > 1 && (
            <div className={styles.posterPeek}>
              <div className={styles.posterPeekCard}>
                <img
                  src={events[nextIndex].imageUrl ?? PLACEHOLDER}
                  alt={events[nextIndex].title}
                  className={styles.posterPeekImg}
                />
              </div>
              {events.length > 2 && (
                <div className={`${styles.posterPeekCard} ${styles.posterPeekCardFar}`}>
                  <img
                    src={events[nextNext].imageUrl ?? PLACEHOLDER}
                    alt={events[nextNext].title}
                    className={styles.posterPeekImg}
                  />
                </div>
              )}
            </div>
          )}

          {/* Flechas */}
          {events.length > 1 && (
            <>
              <button
                className={`${styles.arrow} ${styles.arrowLeft}`}
                onClick={prev}
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className={`${styles.arrow} ${styles.arrowRight}`}
                onClick={next}
                aria-label="Siguiente"
                data-testid="hero-next-btn"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
