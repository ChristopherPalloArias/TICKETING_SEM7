FROM gradle:8-jdk17-alpine AS builder

WORKDIR /build

COPY ms-ticketing/gradle/ gradle/
COPY ms-ticketing/gradlew* ./
COPY ms-ticketing/build.gradle ms-ticketing/
COPY ms-ticketing/settings.gradle ms-ticketing/

RUN chmod +x ./gradlew

RUN ./gradlew dependencies -p ms-ticketing --no-daemon 2>&1 | head -20

COPY ms-ticketing/src/ ms-ticketing/src/

RUN ./gradlew bootJar -p ms-ticketing --no-daemon -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/ms-ticketing/build/libs/ms-ticketing-*.jar app.jar

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
