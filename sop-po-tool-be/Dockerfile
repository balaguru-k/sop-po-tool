FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace/app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY src ./src
COPY config ./config
COPY deploy.sh ./deploy.sh

RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /workspace/app/target/*.jar /app/app.jar
COPY --from=build /workspace/app/config /app/config

EXPOSE 8404

ENV SPRING_PROFILES_ACTIVE=dev \
    SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/sop_po_tool \
    PATH_FILEBASEPATH=/app/uploads

RUN mkdir -p /app/uploads

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
