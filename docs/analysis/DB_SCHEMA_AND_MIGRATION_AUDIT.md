# DB Schema And Migration Audit

## Schema Source Of Truth
- Declarative table definitions: `packages/database/src/schema/aquapulse-schema.ts`
- SQL migration manifest: `packages/database/migrations/manifest.json`
- SQL migration files: `packages/database/migrations/*.sql`

## Current Migration State
- Manifest contains exactly one migration:
  - `0001_core_schema`
- SQL file present:
  - `0001_core_schema.sql`

## Tables Present In Current Relational Foundation
- `ponds`
- `water_quality`
- `feed_entries`
- `tasks`
- `alerts`
- `alert_action_history`
- `saved_alert_views`

## Tables Missing Relative To Runtime Module Set

### Modules Exist But No Matching Table In Current Schema
- attachments
- batches
- audit events
- AI request log
- AI response log
- AI feedback
- AI prompt templates
- AI action drafts

## Migration Consistency Findings

### Consistent
- `aquapulse-schema.ts` matches `0001_core_schema.sql` for the seven defined tables
- Existing indexes in code and SQL line up for the core schema

### Inconsistent / Incomplete
- Runtime module inventory exceeds schema inventory
- Postgres repos for several modules reference logical row sources with no current migration backing

## What The Current DB Strategy Really Is
- Postgres is a bounded adapter rollout, not yet the complete source of truth for every module
- In-memory remains the safe default adapter
- Core operational tables are present
- Supporting platform tables are not yet migrated

## Missing Migrations
- Attachments tables
- Batches tables
- Audit event tables
- AI logging tables:
  - `ai_requests`
  - `ai_responses`
  - `ai_feedback`
  - `ai_prompt_templates`
  - `ai_action_drafts`

## Risk Assessment

### Low Risk
- Core schema changes for existing seven tables are not obviously broken

### Medium Risk
- Teams may assume Postgres readiness for all modules because adapters and repositories already exist

### High Risk
- Adding runtime code that depends on attachments, batches, audit, or AI tables without first adding migrations will create silent architecture drift

## Production Safety Assessment
- Core schema: usable for bounded production-like validation
- Full platform schema: not complete

## Safe Interpretation
The database layer is honest for core operational slices and incomplete for supporting modules. The repo should be treated as “core tables migrated, platform tables pending.”
