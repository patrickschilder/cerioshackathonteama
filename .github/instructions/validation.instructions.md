---
description: "Use when implementing, refactoring, or reviewing changes. Enforces the validation checkpoint workflow for hackathon development."
---
# Validation Workflow

- After each meaningful implementation checkpoint, run `npm run lint`.
- After each meaningful implementation checkpoint, run `npm run compile`.
- After each meaningful implementation checkpoint, run `npm run test`.
- Treat all three commands as required guardrails, not optional cleanup.
- If lint, compile, or test fails, fix the issue before adding more changes.
- `npm run test:e2e` (Playwright) is not part of this per-checkpoint gate — it needs the full
  docker-compose stack running and is run manually or in CI instead.
- Summaries should report which validation commands were run and whether they passed.