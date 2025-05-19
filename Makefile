# Path to Spring Boot backend with pom.xml
BACKEND_DIR=chromeext_backend
JAR_FILE=$(BACKEND_DIR)/target/app.jar

.PHONY: build run start clean test package \
        docker-up docker-down docker-logs docker-clean docker-rebuild \
        check-jar

# === Java Backend ===

build:
	cd $(BACKEND_DIR) && mvn clean package spring-boot:repackage -DskipTests

run:
	java -jar $(JAR_FILE)

check-jar:
	@if [ ! -f $(JAR_FILE) ]; then \
		echo "⚙️  JAR not found. Building..."; \
		$(MAKE) build; \
	else \
		echo "✅ JAR already built."; \
	fi

# === Docker ===

docker-up:
	docker-compose up -d mysql metrics

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down --volumes --remove-orphans

docker-rebuild:
	docker-compose build metrics
	docker-compose up -d metrics

clean:
	cd $(BACKEND_DIR) && mvn clean

test:
	cd $(BACKEND_DIR) && mvn test

# === Full launch ===

start: docker-up check-jar run

restart:
	@echo "🔁 Restarting everything..."
	$(MAKE) docker-down
	$(MAKE) clean
	$(MAKE) build
	$(MAKE) docker-up
	$(MAKE) run