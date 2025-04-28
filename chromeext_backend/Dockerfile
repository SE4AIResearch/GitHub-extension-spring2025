# Stage 1: Build the Maven project
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src

# Repackage properly so app.jar is executable
RUN mvn clean package spring-boot:repackage -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:17-jdk
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
