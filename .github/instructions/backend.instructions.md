---
description: "Use when adding NestJS endpoints, modules, controllers, services, auth logic, or request and response types in the API apps."
applyTo: "apps/api-*/**"
---
# Backend Guidance

- Follow NestJS structure: module, controller, service, and DTO boundaries.
- Keep controllers thin and place business logic in services.
- Reuse shared types and shared helpers where that reduces duplication without hiding behavior.
- Keep auth, validation, and persistence concerns separate.
- Prefer explicit request and response typing.
- For new endpoints, think through the contract from controller to service to Prisma access before writing code.