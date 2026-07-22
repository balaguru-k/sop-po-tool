FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace/app

# Copy pom.xml first to cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN mkdir -p /app/uploads

COPY --from=build /workspace/app/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=dev
ENV PATH_FILEBASEPATH=/app/uploads

EXPOSE 8404
ENTRYPOINT ["java", "-jar", "app.jar"]
