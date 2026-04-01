import { useLocation } from 'react-router-dom';
import type { BreadcrumbSegment } from '../../types/admin.types';

export function useBreadcrumbs(eventTitle?: string): { segments: BreadcrumbSegment[] } {
  const location = useLocation();
  const pathname = location.pathname;

  const segments: BreadcrumbSegment[] = [
    { label: 'Admin', path: '/admin/events' },
  ];

  // Salas
  if (pathname === '/admin/rooms') {
    segments.push({ label: 'Salas', path: '/admin/rooms' });
  }
  // Eventos (general)
  else if (pathname.startsWith('/admin/events')) {
    segments.push({ label: 'Eventos', path: '/admin/events' });

    // Crear evento
    if (pathname.endsWith('/new')) {
      segments.push({ label: 'Crear', path: '/admin/events/new' });
    }
    // Detalle evento
    else {
      const match = pathname.match(/\/admin\/events\/([^/]+)/);
      if (match && match[1] && match[1] !== 'new') {
        segments.push({
          label: eventTitle || 'Detalle',
          path: `/admin/events/${match[1]}`,
        });
      }
    }
  }

  return { segments };
}
