package com.tickets.events.service;

import com.tickets.events.config.RabbitMQConfig;
import com.tickets.events.model.OutboxEvent;
import com.tickets.events.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Scheduler que publica periódicamente los mensajes pendientes del outbox a RabbitMQ.
 *
 * <p>Ejecuta cada {@code outbox.scheduler.fixed-delay-ms} milisegundos (default: 5 s).
 * Procesa en lotes de hasta {@code outbox.batch.size} eventos para limitar
 * la carga por ciclo.</p>
 *
 * <p>Flujo por evento:
 * <ol>
 *   <li>Lee eventos con {@code published=false} ordenados por {@code created_at} (FIFO).</li>
 *   <li>Construye el mensaje AMQP con {@code content-type: application/json}.</li>
 *   <li>Publica en {@code events.exchange} con el routing key almacenado.</li>
 *   <li>Marca {@code published=true} y guarda.</li>
 *   <li>Si la publicación falla, el evento permanece con {@code published=false} y se reintentará.</li>
 * </ol>
 * </p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherScheduler {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${outbox.batch.size:50}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${outbox.scheduler.fixed-delay-ms:5000}")
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxEventRepository
                .findByPublishedFalseOrderByCreatedAtAsc(PageRequest.of(0, batchSize));

        if (pending.isEmpty()) {
            return;
        }

        log.debug("Outbox: procesando {} evento(s) pendiente(s)", pending.size());

        for (OutboxEvent outboxEvent : pending) {
            try {
                MessageProperties props = new MessageProperties();
                props.setContentType(MessageProperties.CONTENT_TYPE_JSON);
                props.setContentEncoding(StandardCharsets.UTF_8.name());

                Message amqpMessage = new Message(
                        outboxEvent.getPayload().getBytes(StandardCharsets.UTF_8),
                        props
                );

                rabbitTemplate.send(
                        RabbitMQConfig.EVENTS_EXCHANGE,
                        outboxEvent.getRoutingKey(),
                        amqpMessage
                );

                outboxEvent.setPublished(true);
                outboxEventRepository.save(outboxEvent);
                log.info("Outbox: publicado eventType={} id={}", outboxEvent.getEventType(), outboxEvent.getId());

            } catch (Exception e) {
                log.error("Outbox: fallo al publicar id={} eventType={} — se reintentará en el próximo ciclo: {}",
                        outboxEvent.getId(), outboxEvent.getEventType(), e.getMessage());
                // No relanzar — permite continuar con el siguiente evento del lote
            }
        }
    }
}
