# Build stage
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace/app

COPY . .
RUN mvn clean package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the built jar file
COPY --from=build /workspace/app/target/*.jar app.jar

# Create required uploads directory
RUN mkdir -p /app/uploads

ENV SPRING_PROFILES_ACTIVE=dev
ENV PATH_FILEBASEPATH=/app/uploads

EXPOSE 8404

ENTRYPOINT ["java", "-jar", "app.jar"]
