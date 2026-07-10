.PHONY: start stop reset migrate seed install wait-for-services

DB_URL := postgresql://cerios:cerios_dev@localhost:5432/elearning

# Start the infrastructure containers and dev servers. Assumes `make install`
# has already been run at least once (env files present, deps installed,
# database migrated + seeded).
start:
	@echo "Starting infrastructure..."
	docker compose up -d postgres keycloak-db keycloak
	$(MAKE) wait-for-services
	@echo ""
	@echo "All services running:"
	@echo "  Keycloak:       http://localhost:8080  (admin / admin)"
	@echo "  API:            http://localhost:3000"
	@echo "  Admin portal:   http://localhost:5174  (instructor-user / instructor123)"
	@echo "  Student portal: http://localhost:5173  (student-user / student123)"
	@echo ""
	@echo "Starting dev servers (Ctrl+C to stop)..."
	npm run dev:api & npm run dev:admin & npm run dev:student & wait

wait-for-services:
	@echo "Waiting for Postgres to be healthy..."
	@until docker compose exec postgres pg_isready -U cerios -d elearning > /dev/null 2>&1; do sleep 1; done
	@echo "Waiting for Keycloak to be ready (this takes ~30s)..."
	@until docker compose exec -T keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin > /dev/null 2>&1; do sleep 3; done

migrate:
	cd packages/database && DATABASE_URL=$(DB_URL) npx prisma migrate dev --name init

seed:
	cd packages/database && DATABASE_URL=$(DB_URL) npx tsx src/seed.ts

# One-time (or after a `make reset`) setup: env files, npm deps, infrastructure,
# migrations and initial seed data.
install:
	@if [ ! -f apps/api-elearning/.env ]; then cp apps/api-elearning/.env.example apps/api-elearning/.env; fi
	@if [ ! -f apps/admin-portal/.env ]; then cp apps/admin-portal/.env.example apps/admin-portal/.env; fi
	@if [ ! -f apps/student-portal/.env ]; then cp apps/student-portal/.env.example apps/student-portal/.env; fi
	npm install
	@echo "Starting infrastructure for initial database setup..."
	docker compose up -d postgres keycloak-db keycloak
	$(MAKE) wait-for-services
	@echo "Running database migrations..."
	$(MAKE) migrate
	@echo "Seeding database..."
	$(MAKE) seed
	@echo ""
	@echo "Setup complete. Run 'make start' to start the app."

stop:
	docker compose down
	@npm run stop:servers --if-present 2>/dev/null || true

# Wipe all data and reseed with fresh sample data.
reset:
	docker compose down -v
	@echo "Starting infrastructure..."
	docker compose up -d postgres keycloak-db keycloak
	$(MAKE) wait-for-services
	@echo "Running database migrations..."
	$(MAKE) migrate
	@echo "Seeding database..."
	$(MAKE) seed
	@echo ""
	@echo "Database reset and reseeded. Run 'make start' to start the app."
