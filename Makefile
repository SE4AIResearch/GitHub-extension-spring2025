# Makefile

.PHONY: build up down restart logs clean prune

# Build the docker images
build:
	docker-compose build

# Start the containers
up:
	docker-compose up

# Start the containers in detached mode
upd:
	docker-compose up -d

# Stop the containers
down:
	docker-compose down

# Restart the containers
restart:
	docker-compose down
	docker-compose up

# View logs
logs:
	docker-compose logs -f

# Clean containers, networks, and volumes
clean:
	docker-compose down --volumes --remove-orphans

# Prune everything (be careful!)
prune:
	docker system prune -af --volumes
