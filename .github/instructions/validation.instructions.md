---
description: "Use when implementing, refactoring, or reviewing changes. Enforces the validation checkpoint workflow for hackathon development."
---
# Validation Workflow

- After each meaningful implementation checkpoint, run `npm run lint`.
- After each meaningful implementation checkpoint, run `npm run compile`.
- Treat both commands as required guardrails, not optional cleanup.
- If lint or compile fails, fix the issue before adding more changes.
- Summaries should report which validation commands were run and whether they passed.