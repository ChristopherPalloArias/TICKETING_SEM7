FROM gradle:8-jdk17-alpine AS builder

WORKDIR /build

COPY ms-notifications/gradle/ gradle/
COPY ms-notifications/gradlew* ./
COPY ms-notifications/build.gradle ms-notifications/

RUN chmod +x ./gradlew

RUN ./gradlew dependencies -p ms-notifications --no-daemon 2>&1 | head -20

COPY ms-notifications/src/ ms-notifications/src/

RUN ./gradlew bootJar -p ms-notifications --no-daemon -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /build/ms-notifications/build/libs/ms-notifications-*.jar app.jar

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8083/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
