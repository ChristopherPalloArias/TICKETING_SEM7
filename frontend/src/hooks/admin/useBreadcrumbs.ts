import { useLocation } from 'react-router-dom';
import type { BreadcrumbSegment } from '../../types/admin.types';

export function useBreadcrumbs(eventTitle?: string): { segments: BreadcrumbSegment[] } {
  const location = useLocation();
  const pathname = location.pathname;

  const segments: BreadcrumbSegment[] = [
    { label: 'Admin', path: '/admin/events' },
    { label: 'Eventos', path: '/admin/events' },
  ];

  if (pathname.endsWith('/new')) {
    segments.push({ label: 'Crear', path: '/admin/events/new' });
  } else {
    const match = pathname.match(/\/admin\/events\/([^/]+)/);
    if (match && match[1] && match[1] !== 'new') {
      segments.push({
        label: eventTitle || 'Detalle',
        path: `/admin/events/${match[1]}`,
      });
    }
  }

  return { segments };
}
