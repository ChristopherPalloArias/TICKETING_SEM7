# Hallazgos y Gaps de Prueba Pendientes - SPEC-021

## Hallazgos principales

### GAP-01 (Alta) - Flujo de compra anonima no verificado end-to-end
- Criterios afectados: SEC03-3.2, SEC06-6.1 (parcial)
- Riesgo: regresion de conversion si el checkout exige auth por error
- Evidencia actual: no hay prueba integrada sin token que complete reserva/pago
- Accion recomendada:
  - Crear test de integracion que valide reserva y pago sin Authorization
  - Verificar generacion de buyerId transitorio y envio de buyerEmail

### GAP-02 (Alta) - Compra autenticada buyer no valida mapeo userId -> buyerId
- Criterios afectados: SEC03-3.3
- Riesgo: inconsistencia de trazabilidad de compras por usuario
- Evidencia actual: no se observa prueba de contrato entre gateway/token y ms-ticketing
- Accion recomendada:
  - Test de integracion API gateway + ms-ticketing que confirme uso de userId del JWT como buyerId
  - Validar fallback a buyerId transitorio cuando no hay token

### GAP-03 (Alta) - Historial /mis-tickets sin prueba de orden descendente
- Criterios afectados: SEC06-6.4
- Riesgo: experiencia incorrecta para compradores autenticados
- Evidencia actual: existe la ruta en App, sin asercion de orden por fecha en tests
- Accion recomendada:
  - Test de pagina MyTicketsPage con dataset de fechas y validacion de orden desc
  - Validar visibilidad solo para buyer autenticado

### GAP-04 (Media) - UI de edicion en PUBLISHED sin evidencia de campos estructurales bloqueados
- Criterios afectados: ADM1.2
- Riesgo: error operativo del admin (backend lo bloquea, pero UX no guiada)
- Evidencia actual: backend rechaza cambios; faltan tests UI de formulario edit
- Accion recomendada:
  - Test de EditEventPage/EventForm en modo edit con status PUBLISHED
  - Asercion de disabled en title/date/capacity/room

### GAP-05 (Media) - Exclusion de eventos CANCELLED en cartelera publica sin prueba explicita
- Criterios afectados: ADM2.1
- Riesgo: mostrar eventos cancelados al comprador
- Evidencia actual: pruebas de cancelacion y estado, pero no de listado publico post-cancelacion
- Accion recomendada:
  - Test de endpoint publico GET /api/v1/events filtrando CANCELLED
  - Test frontend de CarteleraPage para no renderizar eventos cancelados

### GAP-06 (Media) - Notificacion a compradores afectados no comprobada de extremo a extremo
- Criterios afectados: ADM2.2
- Riesgo: cancelacion sin comunicacion efectiva
- Evidencia actual: consumer ack y flujo de mensaje, sin asercion de notificaciones creadas por buyer afectado
- Accion recomendada:
  - Test de integracion en ms-notifications que valide persistencia de notificacion para buyer(s) del evento cancelado
  - Validar no-duplicidad ante reintentos de mensaje

## Priorizacion recomendada (siguiente ciclo)
1. GAP-01, GAP-02, GAP-03
2. GAP-04, GAP-05
3. GAP-06

## Estado QA para fase 4
- La feature presenta buena base de cobertura unitaria/contractual.
- El cierre QA con riesgo bajo requiere cubrir los 3 gaps altos antes de sign-off final de release.
