package com.tickets.msticketing.service;

import com.tickets.msticketing.config.RabbitMQConfig;
import com.tickets.msticketing.model.OutboxEvent;
import com.tickets.msticketing.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherScheduler {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${outbox.batch.size:50}")
    private int batchSize;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxEventRepository
            .findByPublishedFalseOrderByCreatedAtAsc(PageRequest.of(0, batchSize));

        if (pending.isEmpty()) {
            return;
        }

        log.info("OutboxPublisherScheduler: publishing {} pending event(s)", pending.size());

        for (OutboxEvent event : pending) {
            try {
                // The payload is already a serialized JSON String stored in the outbox.
                // Passing it through Jackson2JsonMessageConverter via convertAndSend()
                // would double-serialize it (the String itself becomes a JSON string literal).
                // Instead, we build a raw AMQP Message from the UTF-8 bytes with the
                // correct content-type so the consumer's Jackson2JsonMessageConverter
                // can deserialize it directly into the target DTO record.
                byte[] body = event.getPayload().getBytes(StandardCharsets.UTF_8);
                MessageProperties props = new MessageProperties();
                props.setContentType(MessageProperties.CONTENT_TYPE_JSON);
                props.setContentEncoding("UTF-8");
                Message amqpMessage = new Message(body, props);

                rabbitTemplate.send(
                    RabbitMQConfig.TICKETS_EXCHANGE,
                    event.getRoutingKey(),
                    amqpMessage
                );
                event.setPublished(true);
                outboxEventRepository.save(event);
                log.debug("OutboxPublisherScheduler: published eventId={} type={}", event.getId(), event.getEventType());
            } catch (Exception ex) {
                log.error("OutboxPublisherScheduler: failed to publish eventId={} type={}: {}",
                    event.getId(), event.getEventType(), ex.getMessage());
                // leave published=false for retry in next cycle
            }
        }
    }
}
