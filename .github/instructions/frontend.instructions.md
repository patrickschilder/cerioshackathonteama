---
description: "Use when building frontend pages, React components, routes, forms, or frontend API integration in the app layer."
applyTo: "apps/*-portal/**"
---

# Frontend Guidance

- Match the current frontend stack: React, TypeScript, and Vite.
- Keep screens focused and move reusable UI or helpers into shared packages when reuse is clear.
- Prefer existing routing, API client, and styling patterns from neighboring frontend code.
- Keep forms and data fetching simple and explicit.
- Do not introduce framework-specific conventions that do not belong to the chosen starter stack.
- Validate meaningful frontend changes with `npm run lint` and `npm run compile`.
