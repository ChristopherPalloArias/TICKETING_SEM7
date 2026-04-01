package com.tickets.events.service;

import com.tickets.events.client.TicketingClient;
import com.tickets.events.dto.AdminStatsResponse;
import com.tickets.events.model.EventStatus;
import com.tickets.events.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventStatsService {

    private final EventRepository eventRepository;
    private final TicketingClient ticketingClient;

    public AdminStatsResponse getAdminStats() {
        long totalEvents = eventRepository.count();
        long publishedEvents = eventRepository.countByStatus(EventStatus.PUBLISHED);

        Map<String, Long> ticketStats = ticketingClient.getAdminSummary();
        long totalTicketsSold = ticketStats.getOrDefault("totalTicketsSold", 0L);
        long activeReservations = ticketStats.getOrDefault("activeReservations", 0L);

        return new AdminStatsResponse(totalEvents, publishedEvents, totalTicketsSold, activeReservations);
    }
}
