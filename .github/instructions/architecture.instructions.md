---
description: "Use when designing features, scaffolding new modules, or deciding where code belongs in the monorepo. Covers architecture, boundaries, and package placement."
---

# Monorepo Architecture Guidance

- Use a TypeScript monorepo with a clear split between frontend apps, backend apps, shared packages, and the database package.
- Put user interfaces in frontend apps, HTTP endpoints in NestJS apps, reusable logic in packages, and schema changes in the database package.
- Prefer extending a suitable app or package before creating a new one.
- Keep shared contracts in shared packages instead of duplicating DTOs or types across apps.
- Describe each feature as one path through the system: screen, API endpoint, service, Prisma, database.
- Avoid cross-layer shortcuts such as importing database code directly into frontend code.
- Keep responsibilities simple: frontend renders and collects input, backend applies rules, Prisma handles data access, PostgreSQL stores persistent data.
