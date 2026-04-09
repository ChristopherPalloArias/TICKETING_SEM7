FROM gradle:8-jdk17-alpine AS builder

WORKDIR /build

COPY ms-events/gradle/ gradle/
COPY ms-events/gradlew* ./
COPY ms-events/build.gradle ms-events/
COPY ms-events/settings.gradle ms-events/

RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew

RUN ./gradlew dependencies -p ms-events --no-daemon 2>&1 | head -20

COPY ms-events/src/ ms-events/src/

RUN ./gradlew bootJar -p ms-events --no-daemon -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/ms-events/build/libs/ms-events-*.jar app.jar

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
