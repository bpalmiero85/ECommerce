# ===== 1. Build stage =====
FROM maven:3.9-eclipse-temurin-23-jammy AS build

WORKDIR /app

# Copy root pom and core pom so Maven can resolve modules
COPY pom.xml .
COPY core/pom.xml core/pom.xml

# Download dependencies first (cache friendly)
RUN mvn -pl core -am dependency:go-offline -B

# Now copy the full source
COPY . .

# Build only the core module (your Spring Boot API)
RUN mvn -pl core -am package -DskipTests -B


# ===== 2. Runtime stage =====
FROM eclipse-temurin:23-jre-jammy

WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/core/target/core-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
