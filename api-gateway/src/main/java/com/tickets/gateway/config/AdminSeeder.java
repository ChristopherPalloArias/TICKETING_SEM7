package com.tickets.gateway.config;

import com.tickets.gateway.model.User;
import com.tickets.gateway.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.Assert;

@Configuration
@Slf4j
public class AdminSeeder {

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Bean
    public CommandLineRunner seedAdmin(UserRepository userRepository) {
        return args -> {
            Assert.hasText(adminEmail,
                    "admin.email no puede estar vacío — define la variable de entorno ADMIN_EMAIL");
            Assert.hasText(adminPassword,
                    "admin.password no puede estar vacío — define la variable de entorno ADMIN_PASSWORD");
            Assert.isTrue(adminPassword.length() >= 12,
                    "ADMIN_PASSWORD debe tener al menos 12 caracteres");

            if (userRepository.existsByEmail(adminEmail)) {
                log.info("Admin user already exists: {}", adminEmail);
                return;
            }

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
            User admin = User.builder()
                    .email(adminEmail)
                    .passwordHash(encoder.encode(adminPassword))
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Admin user seeded: {}", adminEmail);
        };
    }
}
