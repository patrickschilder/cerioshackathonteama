# Project Guidelines

## Goal
- Help hackathon participants build a small full-stack application with GitHub Copilot.
- Keep the stack consistent: TypeScript monorepo, React frontend, NestJS API, Prisma, PostgreSQL, shared packages.
- Prefer simple, understandable solutions over clever abstractions.

## Architecture
- Use a monorepo with separate apps for frontend and backend work.
- Keep reusable code in shared packages.
- Put database access behind Prisma and backend services instead of inline SQL in feature code.
- Keep boundaries clear between frontend, backend, shared types, and database concerns.
- Treat each feature as a vertical slice that flows from UI to API to service to database and back.

## Workflow
- Start from one concrete feature, screen, endpoint, or data model.
- Make the smallest change that proves the next step.
- Explain decisions in beginner-friendly language.
- After each meaningful checkpoint, run `npm run lint` and `npm run compile` before continuing.
- If a command fails, fix that failure before widening scope.

## Conventions
- Keep TypeScript strictness intact; do not bypass types with `any` unless there is a documented reason.
- Prefer small, composable services and components.
- Reuse the chosen monorepo structure and naming patterns before creating new structure.
- Do not introduce new frameworks or infrastructure unless the task explicitly requires it.