package com.tickets.msticketing.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String TICKETS_EXCHANGE = "tickets.exchange";
    public static final String TICKET_PAID_ROUTING_KEY = "ticket.paid";
    public static final String TICKET_FAILED_ROUTING_KEY = "ticket.payment_failed";
    public static final String TICKET_EXPIRED_ROUTING_KEY = "ticket.expired";

    @Bean
    public TopicExchange ticketsExchange() {
        return new TopicExchange(TICKETS_EXCHANGE, true, false);
    }

    @Bean
    public Queue ticketPaidQueue() {
        return new Queue("ticketing.ticket.paid");
    }

    @Bean
    public Queue ticketFailedQueue() {
        return new Queue("ticketing.ticket.failed");
    }

    @Bean
    public Queue ticketExpiredQueue() {
        return new Queue("ticketing.ticket.expired");
    }

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
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jackson2JsonMessageConverter());
        return template;
    }
}
