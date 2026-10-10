# Repository audit — integrated farming

Baseline: `origin/develop`, `56b95f6d40b3099b3851e948434ac29c59854aff`, downloaded on 2026-10-09.

The checkout contains a PNPM monorepo with Next.js, NestJS, PostgreSQL adapters, shared contracts and Zod validation. No AGENTS.md was found. `main` is documentation-only. Existing operational modules cover alerts, ponds, water quality, feed and tasks, with supporting batches, attachments, audit and AI modules. Default persistence and frontend transports are development paths; their presence is not production acceptance.

The expansion is additive. Existing pond APIs and their authorization model must not silently become generic livestock/crop APIs. No production infrastructure or existing database has been modified.
