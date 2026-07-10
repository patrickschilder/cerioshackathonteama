---
name: hackathon-workflow
description: "Use for hackathon feature work, scaffolding, vertical slices, agentic AI workflows, checkpoint validation, and architecture-aligned implementation in this monorepo."
argument-hint: "Describe the feature, user story, or workflow you want to build"
---

# Hackathon Workflow

Use this skill when you want Copilot to help implement a feature while staying aligned with the starter architecture and validation rules.

## When To Use
- Starting a new hackathon feature
- Scaffolding a small vertical slice
- Extending a frontend screen and its matching API route
- Turning a user story into concrete code changes
- Reviewing whether a change stayed within the stack and guardrails

## Procedure
1. Restate the feature as one small vertical slice.
2. Identify the owning frontend app, API app, package, and database touchpoints.
3. Start from the nearest concrete anchor such as an existing route, module, component, or Prisma model.
4. Make the smallest useful change first.
5. Run `npm run lint` and `npm run compile` after each meaningful checkpoint.
6. Summarize what changed, what was validated, and what remains.

## Constraints
- Stay within TypeScript, React portals, NestJS APIs, Prisma, and PostgreSQL.
- Stay within TypeScript, React, NestJS, Prisma, and PostgreSQL.
- Prefer existing patterns from neighboring code.
- Do not add a new framework unless the task explicitly asks for it.
- Do not skip validation after a meaningful change.

## Suggested Prompt Shapes
- "Implement a small patient appointment flow following the hackathon workflow skill."
- "Scaffold a new frontend page and matching NestJS endpoint using the hackathon workflow skill."
- "Review this feature against the hackathon workflow skill and tell me where it breaks the architecture."