package com.tickets.msticketing.controller;

import com.tickets.msticketing.model.ReservationStatus;
import com.tickets.msticketing.model.TicketStatus;
import com.tickets.msticketing.repository.ReservationRepository;
import com.tickets.msticketing.repository.TicketRepository;
import com.tickets.msticketing.service.PdfService;
import com.tickets.msticketing.service.ReservationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TicketController.class)
class TicketAdminStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReservationService reservationService;

    @MockBean
    private PdfService pdfService;

    @MockBean
    private TicketRepository ticketRepository;

    @MockBean
    private ReservationRepository reservationRepository;

    // ── GET /api/v1/tickets/admin/stats ───────────────────────────────────────

    @Test
    void getAdminStats_returns200_withTotalTicketsSoldAndActiveReservations() throws Exception {
        // GIVEN
        when(ticketRepository.countByStatus(TicketStatus.VALID)).thenReturn(150L);
        when(reservationRepository.countByStatus(ReservationStatus.PENDING)).thenReturn(25L);

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/tickets/admin/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalTicketsSold").value(150))
            .andExpect(jsonPath("$.activeReservations").value(25));
    }

    @Test
    void getAdminStats_returns200_withZeroValues_whenNoTicketsOrReservations() throws Exception {
        // GIVEN — base de datos vacía
        when(ticketRepository.countByStatus(TicketStatus.VALID)).thenReturn(0L);
        when(reservationRepository.countByStatus(ReservationStatus.PENDING)).thenReturn(0L);

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/tickets/admin/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalTicketsSold").value(0))
            .andExpect(jsonPath("$.activeReservations").value(0));
    }

    @Test
    void getAdminStats_returnsMapWithExactlyTwoKeys() throws Exception {
        // GIVEN
        when(ticketRepository.countByStatus(TicketStatus.VALID)).thenReturn(10L);
        when(reservationRepository.countByStatus(ReservationStatus.PENDING)).thenReturn(5L);

        // WHEN / THEN — el response sólo tiene las dos claves del contrato
        mockMvc.perform(get("/api/v1/tickets/admin/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalTicketsSold").exists())
            .andExpect(jsonPath("$.activeReservations").exists());
    }

    @Test
    void getAdminStats_countsOnlyValidTickets() throws Exception {
        // GIVEN — sólo tickets VALID cuentan; no VOID ni otros estados
        when(ticketRepository.countByStatus(TicketStatus.VALID)).thenReturn(42L);
        when(reservationRepository.countByStatus(ReservationStatus.PENDING)).thenReturn(0L);

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/tickets/admin/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalTicketsSold").value(42));
    }

    @Test
    void getAdminStats_countsOnlyPendingReservations() throws Exception {
        // GIVEN — sólo reservas PENDING cuentan como activas
        when(ticketRepository.countByStatus(TicketStatus.VALID)).thenReturn(0L);
        when(reservationRepository.countByStatus(ReservationStatus.PENDING)).thenReturn(18L);

        // WHEN / THEN
        mockMvc.perform(get("/api/v1/tickets/admin/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.activeReservations").value(18));
    }
}
