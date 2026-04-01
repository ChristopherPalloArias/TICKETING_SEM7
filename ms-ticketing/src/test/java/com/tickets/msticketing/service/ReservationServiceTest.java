package com.tickets.msticketing.service;

import com.tickets.msticketing.model.Reservation;
import com.tickets.msticketing.model.ReservationStatus;
import com.tickets.msticketing.repository.ReservationRepository;
import com.tickets.msticketing.repository.TicketRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private MsEventsIntegrationService msEventsIntegrationService;

    @Mock
    private RabbitMQPublisherService rabbitMQPublisherService;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void testExpireReservationsByEvent_expiresOnlyPendingReservations() {
        UUID eventId = UUID.randomUUID();

        Reservation pendingOne = buildReservation(eventId, ReservationStatus.PENDING);
        Reservation pendingTwo = buildReservation(eventId, ReservationStatus.PENDING);
        Reservation confirmed = buildReservation(eventId, ReservationStatus.CONFIRMED);

        when(reservationRepository.findByEventId(eventId)).thenReturn(List.of(pendingOne, pendingTwo, confirmed));
        when(reservationRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.expireReservationsByEvent(eventId);

        assertThat(pendingOne.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
        assertThat(pendingTwo.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
        assertThat(confirmed.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Reservation>> captor = ArgumentCaptor.forClass(List.class);
        verify(reservationRepository).saveAll(captor.capture());

        List<Reservation> savedReservations = captor.getValue();
        assertThat(savedReservations).hasSize(2);
        assertThat(savedReservations)
            .extracting(Reservation::getId)
            .containsExactlyInAnyOrder(pendingOne.getId(), pendingTwo.getId());
    }

    @Test
    void testExpireReservationsByEvent_whenNoPending_savesEmptyList() {
        UUID eventId = UUID.randomUUID();
        Reservation confirmed = buildReservation(eventId, ReservationStatus.CONFIRMED);

        when(reservationRepository.findByEventId(eventId)).thenReturn(List.of(confirmed));
        when(reservationRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.expireReservationsByEvent(eventId);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Reservation>> captor = ArgumentCaptor.forClass(List.class);
        verify(reservationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).isEmpty();
    }

    private Reservation buildReservation(UUID eventId, ReservationStatus status) {
        LocalDateTime now = LocalDateTime.now();
        return Reservation.builder()
            .id(UUID.randomUUID())
            .eventId(eventId)
            .tierId(UUID.randomUUID())
            .buyerId(UUID.randomUUID())
            .status(status)
            .validUntilAt(now.plusMinutes(5))
            .createdAt(now.minusMinutes(5))
            .updatedAt(now.minusMinutes(1))
            .paymentAttempts(0)
            .build();
    }
}
