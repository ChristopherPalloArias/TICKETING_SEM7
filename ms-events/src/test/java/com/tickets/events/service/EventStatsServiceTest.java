package com.tickets.events.service;

import com.tickets.events.client.TicketingClient;
import com.tickets.events.dto.AdminStatsResponse;
import com.tickets.events.model.EventStatus;
import com.tickets.events.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventStatsServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TicketingClient ticketingClient;

    @InjectMocks
    private EventStatsService eventStatsService;

    // ── getAdminStats — happy path ─────────────────────────────────────────────

    @Test
    void getAdminStats_returnsAggregatedCounts_fromLocalAndRemoteSources() {
        // GIVEN
        when(eventRepository.count()).thenReturn(10L);
        when(eventRepository.countByStatus(EventStatus.PUBLISHED)).thenReturn(4L);
        when(ticketingClient.getAdminSummary()).thenReturn(
            Map.of("totalTicketsSold", 250L, "activeReservations", 30L)
        );

        // WHEN
        AdminStatsResponse result = eventStatsService.getAdminStats();

        // THEN
        assertThat(result.totalEvents()).isEqualTo(10L);
        assertThat(result.publishedEvents()).isEqualTo(4L);
        assertThat(result.totalTicketsSold()).isEqualTo(250L);
        assertThat(result.activeReservations()).isEqualTo(30L);
    }

    @Test
    void getAdminStats_callsEventRepositoryCount() {
        // GIVEN
        when(eventRepository.count()).thenReturn(5L);
        when(eventRepository.countByStatus(EventStatus.PUBLISHED)).thenReturn(2L);
        when(ticketingClient.getAdminSummary()).thenReturn(Map.of());

        // WHEN
        eventStatsService.getAdminStats();

        // THEN
        verify(eventRepository).count();
        verify(eventRepository).countByStatus(EventStatus.PUBLISHED);
    }

    @Test
    void getAdminStats_callsTicketingClientForRemoteStats() {
        // GIVEN
        when(eventRepository.count()).thenReturn(0L);
        when(eventRepository.countByStatus(EventStatus.PUBLISHED)).thenReturn(0L);
        when(ticketingClient.getAdminSummary()).thenReturn(Map.of("totalTicketsSold", 5L, "activeReservations", 1L));

        // WHEN
        eventStatsService.getAdminStats();

        // THEN
        verify(ticketingClient).getAdminSummary();
    }

    // ── getAdminStats — degradación graceful ──────────────────────────────────

    @Test
    void getAdminStats_returnsZeroTicketStats_whenTicketingClientReturnsEmptyMap() {
        // GIVEN — TicketingClient ya aplica degradación internamente y retorna mapa vacío
        when(eventRepository.count()).thenReturn(3L);
        when(eventRepository.countByStatus(EventStatus.PUBLISHED)).thenReturn(1L);
        when(ticketingClient.getAdminSummary()).thenReturn(Map.of());

        // WHEN
        AdminStatsResponse result = eventStatsService.getAdminStats();

        // THEN — getOrDefault garantiza 0 cuando la clave no existe
        assertThat(result.totalTicketsSold()).isZero();
        assertThat(result.activeReservations()).isZero();
    }

    @Test
    void getAdminStats_returnsZeroTicketStats_whenTicketingClientReturnsDefaultFallback() {
        // GIVEN — simula el valor de degradación que devuelve TicketingClient.getAdminSummary()
        when(eventRepository.count()).thenReturn(7L);
        when(eventRepository.countByStatus(EventStatus.PUBLISHED)).thenReturn(3L);
        when(ticketingClient.getAdminSummary()).thenReturn(
            Map.of("totalTicketsSold", 0L, "activeReservations", 0L)
        );

        // WHEN
        AdminStatsResponse result = eventStatsService.getAdminStats();

        // THEN
        assertThat(result.totalEvents()).isEqualTo(7L);
        assertThat(result.publishedEvents()).isEqualTo(3L);
        assertThat(result.totalTicketsSold()).isZero();
        assertThat(result.activeReservations()).isZero();
    }

    @Test
    void getAdminStats_stillReturnsLocalStats_whenOnlyRemoteKeysMissing() {
        // GIVEN — mapa devuelto tiene sólo la clave activeReservations
        when(eventRepository.count()).thenReturn(12L);
        when(eventRepository.countByStatus(EventStatus.PUBLISHED)).thenReturn(6L);
        when(ticketingClient.getAdminSummary()).thenReturn(Map.of("activeReservations", 8L));

        // WHEN
        AdminStatsResponse result = eventStatsService.getAdminStats();

        // THEN — totalTicketsSold cae al default 0; activeReservations se lee correctamente
        assertThat(result.totalEvents()).isEqualTo(12L);
        assertThat(result.publishedEvents()).isEqualTo(6L);
        assertThat(result.totalTicketsSold()).isZero();
        assertThat(result.activeReservations()).isEqualTo(8L);
    }
}
