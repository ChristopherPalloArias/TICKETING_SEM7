# Stage 1: Builder
FROM gradle:8-jdk17-alpine AS builder
WORKDIR /build
COPY api-gateway/gradle/ gradle/
COPY api-gateway/gradlew* ./
COPY api-gateway/build.gradle api-gateway/
COPY api-gateway/settings.gradle api-gateway/
RUN chmod +x ./gradlew
RUN ./gradlew dependencies -p api-gateway --no-daemon 2>&1 | head -20
COPY api-gateway/src/ api-gateway/src/
RUN ./gradlew bootJar -p api-gateway --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/api-gateway/build/libs/api-gateway-*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider \
    http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
