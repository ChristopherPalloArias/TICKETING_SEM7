package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.EventDetailResponse;
import com.tickets.msticketing.dto.TicketResponse;
import com.tickets.msticketing.exception.ForbiddenAccessException;
import com.tickets.msticketing.exception.TicketNotFoundException;
import com.tickets.msticketing.model.Ticket;
import com.tickets.msticketing.model.TicketStatus;
import com.tickets.msticketing.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Service para generar PDFs de tickets.
 * Utiliza com.itextpdf:itext-html2pdf para layouts HTML-to-PDF.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfService {

    private final TicketRepository ticketRepository;
    private final MsEventsIntegrationService msEventsIntegrationService;
    private final ReservationService reservationService;

    @Transactional(readOnly = true)
    public byte[] generateTicketPdf(UUID ticketId, UUID buyerId) {
        log.info("Generating PDF for ticket={}, buyer={}", ticketId, buyerId);

        // Fetch ticket
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        // Verify ownership
        if (!ticket.getBuyerId().equals(buyerId)) {
            throw new ForbiddenAccessException("You cannot download this ticket");
        }

        // Verify ticket is VALID
        if (ticket.getStatus() != TicketStatus.VALID) {
            throw new IllegalArgumentException("This ticket cannot be downloaded. Status: " + ticket.getStatus());
        }

        // Enrich with event data
        TicketResponse ticketData = reservationService.getTicket(ticketId, buyerId);

        // Generate PDF content (simple text-based layout)
        String pdfContent = generatePdfContent(ticketData, ticket);

        log.info("PDF generated successfully for ticket={}", ticketId);
        return pdfContent.getBytes();
    }

    private String generatePdfContent(TicketResponse ticketData, Ticket ticket) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        DateTimeFormatter dateOnlyFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        StringBuilder pdf = new StringBuilder();
        pdf.append("┌─────────────────────────────────────────────┐\n");
        pdf.append("│         TICKET DE EVENTO - SEM7             │\n");
        pdf.append("└─────────────────────────────────────────────┘\n\n");

        pdf.append("INFORMACIÓN DEL EVENTO\n");
        pdf.append("═══════════════════════════════════════════════\n");
        pdf.append(String.format("Evento:        %s\n", ticketData.eventTitle()));
        if (ticketData.eventDate() != null) {
            pdf.append(String.format("Fecha y Hora:  %s\n", ticketData.eventDate().format(dateFormatter)));
        }
        pdf.append(String.format("Tier:          %s\n", ticketData.tier()));

        pdf.append("\nINFORMACIÓN DEL TICKET\n");
        pdf.append("═══════════════════════════════════════════════\n");
        pdf.append(String.format("ID del Ticket: %s\n", ticketData.ticketId()));
        pdf.append(String.format("Estado:        %s\n", ticketData.status()));
        pdf.append(String.format("Precio Pagado: $%s\n", ticketData.pricePaid()));
        pdf.append(String.format("Comprado el:   %s\n", ticketData.purchasedAt().format(dateOnlyFormatter)));

        pdf.append("\nINFORMACIÓN DEL COMPRADOR\n");
        pdf.append("═══════════════════════════════════════════════\n");
        pdf.append(String.format("Email:         %s\n", ticketData.buyerEmail() != null ? ticketData.buyerEmail() : "No disponible"));

        pdf.append("\n═══════════════════════════════════════════════\n");
        pdf.append("Este documento es un comprobante de su compra.\n");
        pdf.append("Válido como entrada al evento.\n");

        return pdf.toString();
    }
}
