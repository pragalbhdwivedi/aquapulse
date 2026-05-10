# AI Persistence Foundation

## Scope

This pass adds a bounded PostgreSQL-backed persistence foundation for:

- `ai_requests`
- `ai_responses`

It does **not** redesign AquaPulse AI behavior, contracts, orchestration, or operator-facing flows.

## What Is Persisted Now

### `ai_requests`

Persisted fields:

- `id`
- `request_type`
- `requested_by`
- `input_payload`
- `status`
- `created_at`
- `updated_at`

### `ai_responses`

Persisted fields:

- `id`
- `request_id`
- `status`
- `output_text`
- `model`
- `created_at`
- `updated_at`

## Storage Shape

### `ai_requests`

- primary key: `id`
- JSON payload column: `input_payload`
- indexes:
  - `idx_ai_requests_type_status_created_at`
  - `idx_ai_requests_requested_by_created_at`

### `ai_responses`

- primary key: `id`
- foreign key: `request_id -> ai_requests(id) on delete cascade`
- indexes:
  - `idx_ai_responses_request_created_at`
  - `idx_ai_responses_status_created_at`
  - `idx_ai_responses_model_created_at`

## Runtime Wiring

The bounded persistence seam stays inside the existing AI repository port:

- `saveRequestRecord`
- `saveResponseRecord`
- `listRequests`
- `list`
- `getById`

No frontend API contracts were changed.

## Local-Safe Behavior

- default in-memory runtime behavior remains unchanged
- Postgres-backed durability is only used when the existing Postgres persistence adapter is selected
- repository writes are best-effort and fall back to in-memory placeholder state if the database is unavailable

## Retention Notes

This pass does **not** add retention jobs, archival, or purge tooling.

Recommended next operational follow-up:

- define bounded retention windows for AI request/response logs
- decide whether `output_text` should eventually be truncated, archived, or externally exported

## What Remains Placeholder-Backed

Still placeholder-backed after this pass:

- `ai_feedback`
- `ai_prompt_templates`
- `ai_action_drafts`
- `packages/ai`
- any worker/queue/orchestration flow

## Safe Next Persistence Seam

Recommended next bounded persistence seam:

- durable persistence for `ai_feedback`, only if feedback review becomes operationally important
- otherwise a bounded query/index optimization pass for existing `ai_requests` / `ai_responses`
