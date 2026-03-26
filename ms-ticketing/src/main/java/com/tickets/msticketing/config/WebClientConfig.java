package com.tickets.msticketing.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.tcp.TcpClient;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    @Value("${clients.ms-events.base-url:http://ms-events:8081}")
    private String msEventsBaseUrl;

    @Bean
    public WebClient msEventsWebClient() {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2000)
            .option(ChannelOption.SO_KEEPALIVE, true)
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(3, TimeUnit.SECONDS))
                .addHandlerLast(new WriteTimeoutHandler(3, TimeUnit.SECONDS)));

        return WebClient.builder()
            .baseUrl(msEventsBaseUrl)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .exchangeStrategies(ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build())
            .build();
    }
}
