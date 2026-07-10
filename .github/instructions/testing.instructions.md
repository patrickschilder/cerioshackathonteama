---
description: "Use when writing, reviewing, or reasoning about unit tests or end-to-end tests anywhere in the monorepo."
---
# Testing Guidance

## Test runners
- Use Vitest for all unit tests, in `apps/api-elearning`, `apps/admin-portal`, and
  `apps/student-portal`. Do not introduce Jest, even though it is NestJS's own default scaffold.
- Use Playwright for all end-to-end tests. E2E tests live only in `apps/e2e`, never colocated
  with app source.

## Location and naming
- Colocate unit tests next to the file they test.
- Backend (`apps/api-elearning`): `*.spec.ts` (e.g. `courses.service.spec.ts` next to
  `courses.service.ts`).
- Frontend (`apps/admin-portal`, `apps/student-portal`): `*.test.tsx` (e.g. `NavBar.test.tsx`
  next to `NavBar.tsx`).

## Backend unit tests
- Instantiate services directly, e.g. `new CoursesService(mockPrisma)`. This codebase wires
  dependencies with explicit `@Inject("PRISMA")` tokens rather than implicit type-based DI, so
  `@nestjs/testing`'s `TestingModule` is unnecessary for plain service tests.
- Mock `PrismaClient` by hand with `vi.fn()` per model/method used. Never hit a real database in
  a unit test.
- Structure tests as Arrange-Act-Assert. One behavior per `it`. Use descriptive names, e.g.
  `it("throws ForbiddenException when a student requests an unpublished course")`.

## Frontend unit tests
- Use `@testing-library/react` with a `jsdom` environment.
- Test components with real conditional logic or branching (role-based rendering, computed
  labels, etc.). Do not write tests for purely presentational components with no logic.

## When tests are required
- Any new NestJS service method with branching logic (role or ownership checks, error paths)
  must ship with a unit test in the same change.
- Any new non-trivial React component or hook (conditional rendering, derived state) must ship
  with a unit test in the same change.

## End-to-end tests (Playwright, `apps/e2e`)
- Keep E2E coverage at smoke-test level only — verify critical flows work end-to-end. Unit tests
  own detailed branch/edge-case coverage.
- Split "api" tests (Playwright's `request` fixture, no browser) from "frontend" tests (a real
  browser using a saved `storageState`).
- E2E tests run against the full docker-compose stack (Postgres, Keycloak, API, both portals)
  and rely on the seeded dev data. Don't assert more than `packages/database/src/seed.ts`
  guarantees.

## Validation checkpoint
- After each meaningful implementation checkpoint, run `npm run lint`, `npm run compile`, and
  `npm run test` (see `validation.instructions.md`). `npm run test:e2e` is not part of the
  per-checkpoint gate — it requires the full docker stack and is run manually or in CI.
