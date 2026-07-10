.PHONY: start stop reset migrate seed install

start: install
	@echo "Starting infrastructure..."
	docker compose up -d postgres keycloak-db keycloak
	@echo "Waiting for Postgres to be healthy..."
	@until docker compose exec postgres pg_isready -U cerios -d elearning > /dev/null 2>&1; do sleep 1; done
	@echo "Waiting for Keycloak to be ready (this takes ~30s)..."
	@until docker compose exec -T keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin > /dev/null 2>&1; do sleep 3; done
	@echo "Running database migrations..."
	cd packages/database && DATABASE_URL=postgresql://cerios:cerios_dev@localhost:5432/elearning npx prisma migrate dev --name init
	@echo "Seeding database..."
	cd packages/database && DATABASE_URL=postgresql://cerios:cerios_dev@localhost:5432/elearning npx tsx src/seed.ts
	@echo ""
	@echo "All services running:"
	@echo "  Keycloak:       http://localhost:8080  (admin / admin)"
	@echo "  API:            http://localhost:3000"
	@echo "  Admin portal:   http://localhost:5174  (instructor-user / instructor123)"
	@echo "  Student portal: http://localhost:5173  (student-user / student123)"
	@echo ""
	@echo "Starting dev servers (Ctrl+C to stop)..."
	npm run dev:api & npm run dev:admin & npm run dev:student & wait

install:
	@if [ ! -f apps/api-elearning/.env ]; then cp apps/api-elearning/.env.example apps/api-elearning/.env; fi
	@if [ ! -f apps/admin-portal/.env ]; then cp apps/admin-portal/.env.example apps/admin-portal/.env; fi
	@if [ ! -f apps/student-portal/.env ]; then cp apps/student-portal/.env.example apps/student-portal/.env; fi
	npm install

stop:
	docker compose down
	@pkill -f "nest start" || true
	@pkill -f "vite" || true

reset:
	docker compose down -v
	@echo "All data wiped. Run 'make start' to start fresh."
