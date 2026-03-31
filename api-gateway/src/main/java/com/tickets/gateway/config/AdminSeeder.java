package com.tickets.gateway.config;

import com.tickets.gateway.model.User;
import com.tickets.gateway.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@Slf4j
public class AdminSeeder {

    @Value("${admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${admin.password:Admin1234!}")
    private String adminPassword;

    @Bean
    public CommandLineRunner seedAdmin(UserRepository userRepository) {
        return args -> {
            if (userRepository.existsByEmail(adminEmail)) {
                log.info("Admin user already exists: {}", adminEmail);
                return;
            }
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
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
