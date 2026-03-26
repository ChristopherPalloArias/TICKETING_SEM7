package com.tickets.msticketing.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OperationCustomizer;
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
                    .url("http://localhost:8082")
                    .description("Development Server — ms-ticketing")
            ))
            .info(new Info()
                .title("ms-ticketing API")
                .version("1.0.0")
                .description("""
                    API para gestión de reservas y tickets en el sistema de ticketing.
                    
                    **Headers requeridos en todos los endpoints:**
                    - `X-User-Id`: UUID del comprador (simula el token de autenticación)
                    
                    **Flujo principal:**
                    1. `POST /api/v1/reservations` → Crear reserva (PENDING, 10 min de vigencia)
                    2. `POST /api/v1/reservations/{id}/payments` → Procesar mock payment (APPROVED / DECLINED)
                    3. `GET /api/v1/tickets/{ticketId}` → Consultar ticket generado tras pago aprobado
                    """)
                .contact(new Contact()
                    .name("Ticketing Team")
                    .email("support@ticketing.local"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0.html")));
    }

    /**
     * Agrega el header X-User-Id como parámetro global a todas las operaciones
     * para que Swagger UI lo muestre en cada endpoint automáticamente.
     */
    @Bean
    public OperationCustomizer globalXUserIdHeader() {
        return (operation, handlerMethod) -> {
            operation.addParametersItem(
                new Parameter()
                    .in("header")
                    .name("X-User-Id")
                    .description("UUID del comprador (ej: 550e8400-e29b-41d4-a716-446655440000)")
                    .required(true)
                    .example("550e8400-e29b-41d4-a716-446655440000")
                    .schema(new io.swagger.v3.oas.models.media.StringSchema().format("uuid"))
            );
            return operation;
        };
    }
}
