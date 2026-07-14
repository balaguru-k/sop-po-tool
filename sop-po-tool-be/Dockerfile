FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace/app

COPY pom.xml .
COPY src ./src
COPY config ./config

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /workspace/app/target/*.jar app.jar
COPY --from=build /workspace/app/config ./config

RUN mkdir -p /app/uploads

ENV SPRING_PROFILES_ACTIVE=dev
ENV SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/sop_po_tool
ENV PATH_FILEBASEPATH=/app/uploads

EXPOSE 8404

ENTRYPOINT ["java","-jar","app.jar"]
