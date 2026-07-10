# Cerios Academy — E-Learning Portal

Full-stack TypeScript monorepo. React + Vite frontends, NestJS API, Prisma + PostgreSQL, Keycloak authentication.

## Application URLs

| Service        | URL                   | Credentials                         |
| -------------- | --------------------- | ----------------------------------- |
| Student portal | http://localhost:5173 | `student-user` / `student123`       |
| Admin portal   | http://localhost:5174 | `instructor-user` / `instructor123` |
| REST API       | http://localhost:3000 | —                                   |
| Keycloak admin | http://localhost:8080 | `admin` / `admin`                   |

---

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm 10+

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Start infrastructure (Postgres + Keycloak)

```bash
docker compose up -d postgres keycloak
```

Wait ~30 seconds for Keycloak to finish importing the realm. You can check:

```bash
docker compose logs keycloak --follow
# Ready when you see: "Listening on: http://0.0.0.0:8080"
```

Keycloak admin console: **http://localhost:8080** — login with `admin` / `admin`

---

## 3. Set up the database

```bash
# Copy environment files
cp apps/api-elearning/.env.example apps/api-elearning/.env
cp apps/admin-portal/.env.example apps/admin-portal/.env
cp apps/student-portal/.env.example apps/student-portal/.env

# Run Prisma migrations (creates all tables)
# Note: DATABASE_URL must be set — export it first (or use the Makefile which sets it automatically)
cd packages/database
DATABASE_URL=postgresql://cerios:cerios_dev@localhost:5432/elearning npx prisma migrate dev --name init
cd ../..

# Seed with sample data (optional but recommended)
npm run db:seed
```

---

## 4. Start the applications

Open **three terminals**:

**Terminal 1 — API** (http://localhost:3000)

```bash
npm run dev:api
```

**Terminal 2 — Admin portal** (http://localhost:5174)

```bash
npm run dev:admin
```

**Terminal 3 — Student portal** (http://localhost:5173)

```bash
npm run dev:student
```

---

## 5. Log in

| Portal  | URL                   | Username          | Password        | Role       |
| ------- | --------------------- | ----------------- | --------------- | ---------- |
| Admin   | http://localhost:5174 | `admin-user`      | `admin123`      | Admin      |
| Admin   | http://localhost:5174 | `instructor-user` | `instructor123` | Instructor |
| Student | http://localhost:5173 | `student-user`    | `student123`    | Student    |

---

## Typical workflow

### As an instructor

1. Log in to the **admin portal** (http://localhost:5174) with `instructor-user`
2. Click **Nieuwe cursus** to create a course
3. Open the course → click the upload zone to upload a `.pptx` file
4. Once slides are imported, click **Quiz genereren** to auto-generate quiz questions
5. Click **Publiceren** to make the course visible to students

### As a student

1. Log in to the **student portal** (http://localhost:5173) with `student-user`
2. Open a published course from the dashboard
3. Navigate through slides — progress is tracked automatically
4. After the last slide, click **Quiz starten** to take the quiz
5. Submit answers and see your score with per-question feedback

---

## Project structure

```
├── apps/
│   ├── api-elearning/        # NestJS REST API (port 3000)
│   ├── admin-portal/         # React + Vite admin UI (port 5174)
│   └── student-portal/       # React + Vite student UI (port 5173)
├── packages/
│   ├── database/             # Prisma schema + PrismaClient + seed
│   ├── shared-types/         # Shared TypeScript DTOs and enums
│   └── ui-theme/             # Cerios Academy CSS tokens + component styles
├── keycloak/
│   └── realm-export.json     # Auto-imported Keycloak realm config
└── docker-compose.yml        # Postgres + Keycloak + API
```

---

## Useful commands

```bash
# Validate TypeScript across all apps
cd apps/api-elearning && npx tsc --noEmit
cd apps/admin-portal  && npx tsc --noEmit
cd apps/student-portal && npx tsc --noEmit

# Prisma Studio (visual DB browser)
cd packages/database && npx prisma studio

# Re-run seed
npm run db:seed

# Stop all Docker services
docker compose down

# Stop and remove all data (full reset)
docker compose down -v
```

---

## API endpoints

All endpoints require a Bearer token from Keycloak.

| Method | Path                                         | Role             | Description         |
| ------ | -------------------------------------------- | ---------------- | ------------------- |
| GET    | `/users/me`                                  | any              | Current user info   |
| GET    | `/courses`                                   | any              | List courses        |
| POST   | `/courses`                                   | instructor/admin | Create course       |
| PATCH  | `/courses/:id`                               | instructor/admin | Update course       |
| DELETE | `/courses/:id`                               | instructor/admin | Delete course       |
| GET    | `/courses/:id/slides`                        | any              | List slides         |
| POST   | `/courses/:id/upload/pptx`                   | instructor/admin | Upload .pptx        |
| POST   | `/courses/:id/quiz/generate`                 | instructor/admin | Generate quiz       |
| GET    | `/courses/:id/quiz`                          | any              | Get quiz questions  |
| POST   | `/courses/:id/quiz/submit`                   | student          | Submit quiz answers |
| GET    | `/courses/:id/progress`                      | any              | Get progress %      |
| POST   | `/courses/:id/progress/slides/:slideId/view` | any              | Mark slide viewed   |
