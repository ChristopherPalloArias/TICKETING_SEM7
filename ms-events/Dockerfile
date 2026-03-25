# Stage 1: Builder
FROM gradle:8-jdk17-alpine AS builder

WORKDIR /build

# Copy Gradle wrapper and build configuration
COPY ms-events/gradle/ gradle/
COPY ms-events/gradlew* ./
COPY ms-events/build.gradle ms-events/

# Make wrapper executable
RUN chmod +x ./gradlew

# Download dependencies (before copying source for better caching)
RUN ./gradlew dependencies -p ms-events --no-daemon 2>&1 | head -20

# Copy full source code
COPY ms-events/src/ ms-events/src/

# Compile and package
RUN ./gradlew bootJar -p ms-events --no-daemon -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /build/ms-events/build/libs/ms-events-*.jar app.jar

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
