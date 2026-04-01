package com.tickets.msnotifications.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Main exchange (shared with ms-ticketing)
    public static final String TICKETS_EXCHANGE = "tickets.exchange";

    // Events exchange (published by ms-events)
    public static final String EVENTS_EXCHANGE = "events.exchange";

    // DLQ exchange
    public static final String TICKETS_DLQ_EXCHANGE = "tickets.dlq.exchange";

    // Main queues
    public static final String TICKET_PAID_QUEUE = "ticketing.ticket.paid";
    public static final String TICKET_FAILED_QUEUE = "ticketing.ticket.failed";
    public static final String TICKET_EXPIRED_QUEUE = "ticketing.ticket.expired";
    public static final String EVENT_CANCELLED_QUEUE = "notifications.event.cancelled";

    // DLQ queues
    public static final String TICKET_PAID_DLQ = "ticketing.ticket.paid.dlq";
    public static final String TICKET_FAILED_DLQ = "ticketing.ticket.failed.dlq";
    public static final String TICKET_EXPIRED_DLQ = "ticketing.ticket.expired.dlq";

    // Routing keys
    public static final String TICKET_PAID_ROUTING_KEY = "ticket.paid";
    public static final String TICKET_FAILED_ROUTING_KEY = "ticket.payment_failed";
    public static final String TICKET_EXPIRED_ROUTING_KEY = "ticket.expired";
    public static final String EVENT_CANCELLED_ROUTING_KEY = "event.cancelled";

    // ─── Exchanges ────────────────────────────────────────────────────────────

    @Bean
    public TopicExchange ticketsExchange() {
        return new TopicExchange(TICKETS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange eventsExchange() {
        return new TopicExchange(EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange ticketsDlqExchange() {
        return new DirectExchange(TICKETS_DLQ_EXCHANGE, true, false);
    }

    // ─── Main queues (with DLQ headers) ──────────────────────────────────────

    @Bean
    public Queue ticketPaidQueue() {
        return QueueBuilder.durable(TICKET_PAID_QUEUE)
            .withArgument("x-dead-letter-exchange", TICKETS_DLQ_EXCHANGE)
            .withArgument("x-dead-letter-routing-key", TICKET_PAID_DLQ)
            .build();
    }

    @Bean
    public Queue ticketFailedQueue() {
        return QueueBuilder.durable(TICKET_FAILED_QUEUE)
            .withArgument("x-dead-letter-exchange", TICKETS_DLQ_EXCHANGE)
            .withArgument("x-dead-letter-routing-key", TICKET_FAILED_DLQ)
            .build();
    }

    @Bean
    public Queue ticketExpiredQueue() {
        return QueueBuilder.durable(TICKET_EXPIRED_QUEUE)
            .withArgument("x-dead-letter-exchange", TICKETS_DLQ_EXCHANGE)
            .withArgument("x-dead-letter-routing-key", TICKET_EXPIRED_DLQ)
            .build();
    }

    @Bean
    public Queue eventCancelledQueue() {
        return QueueBuilder.durable(EVENT_CANCELLED_QUEUE).build();
    }

    // ─── DLQ queues ───────────────────────────────────────────────────────────

    @Bean
    public Queue ticketPaidDlq() {
        return QueueBuilder.durable(TICKET_PAID_DLQ).build();
    }

    @Bean
    public Queue ticketFailedDlq() {
        return QueueBuilder.durable(TICKET_FAILED_DLQ).build();
    }

    @Bean
    public Queue ticketExpiredDlq() {
        return QueueBuilder.durable(TICKET_EXPIRED_DLQ).build();
    }

    // ─── Bindings (main) ─────────────────────────────────────────────────────

    @Bean
    public Binding bindPaidQueue(Queue ticketPaidQueue, TopicExchange ticketsExchange) {
        return BindingBuilder.bind(ticketPaidQueue).to(ticketsExchange).with(TICKET_PAID_ROUTING_KEY);
    }

    @Bean
    public Binding bindFailedQueue(Queue ticketFailedQueue, TopicExchange ticketsExchange) {
        return BindingBuilder.bind(ticketFailedQueue).to(ticketsExchange).with(TICKET_FAILED_ROUTING_KEY);
    }

    @Bean
    public Binding bindExpiredQueue(Queue ticketExpiredQueue, TopicExchange ticketsExchange) {
        return BindingBuilder.bind(ticketExpiredQueue).to(ticketsExchange).with(TICKET_EXPIRED_ROUTING_KEY);
    }

    @Bean
    public Binding bindEventCancelledQueue(Queue eventCancelledQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(eventCancelledQueue).to(eventsExchange).with(EVENT_CANCELLED_ROUTING_KEY);
    }

    // ─── Bindings (DLQ) ──────────────────────────────────────────────────────

    @Bean
    public Binding bindPaidDlq(Queue ticketPaidDlq, DirectExchange ticketsDlqExchange) {
        return BindingBuilder.bind(ticketPaidDlq).to(ticketsDlqExchange).with(TICKET_PAID_DLQ);
    }

    @Bean
    public Binding bindFailedDlq(Queue ticketFailedDlq, DirectExchange ticketsDlqExchange) {
        return BindingBuilder.bind(ticketFailedDlq).to(ticketsDlqExchange).with(TICKET_FAILED_DLQ);
    }

    @Bean
    public Binding bindExpiredDlq(Queue ticketExpiredDlq, DirectExchange ticketsDlqExchange) {
        return BindingBuilder.bind(ticketExpiredDlq).to(ticketsDlqExchange).with(TICKET_EXPIRED_DLQ);
    }

    // ─── Message converter ────────────────────────────────────────────────────

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jackson2JsonMessageConverter());
        return template;
    }

    // ─── Listener container factory with MANUAL ACK ───────────────────────────
    // Note: RetryInterceptorBuilder is NOT used here because consumers handle ACK/NACK
    // manually inside try/catch blocks. Spring's retry advice only fires on exceptions
    // that escape the listener method, which never happens with MANUAL ACK. Instead,
    // unrecoverable failures call basicNack(requeue=false) which routes to the DLQ.

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jackson2JsonMessageConverter());
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        factory.setPrefetchCount(1);
        return factory;
    }
}
