---
description: "Use when editing Prisma schema, adding migrations, changing PostgreSQL data models, or implementing seed and database access logic."
applyTo: "packages/database/**"
---
# Database Guidance

- Use Prisma as the default database access layer.
- Keep schema changes, migrations, generation, and seed logic inside the database package.
- Make schema changes explicit and safe; name models and fields clearly.
- Prefer additive migrations during hackathon work unless removal is necessary.
- After schema changes, make sure application code, shared types, and seed behavior remain aligned.
- Validate database-related work with the repo scripts that exercise type generation, compile, and lint.