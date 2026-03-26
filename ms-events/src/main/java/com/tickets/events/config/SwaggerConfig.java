package com.tickets.events.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .servers(List.of(
                new Server()
                    .url("http://localhost:8081")
                    .description("Development Server"),
                new Server()
                    .url("http://api.ticketing.local")
                    .description("Production Server")
            ))
            .info(new Info()
                .title("Ticketing System API")
                .version("1.0.0")
                .description("API para gestionar eventos, salas y venta de entradas en el sistema de ticketing")
                .contact(new Contact()
                    .name("Ticketing Team")
                    .email("support@ticketing.local")
                    .url("https://ticketing.local"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0.html")));
    }
}
