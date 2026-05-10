# AI Feedback Schema Model Review

## Current Schema

Current AI persistence schema includes:

- `ai_requests`
- `ai_responses`

There is no current durable `ai_feedback` table.

## Existing Durable Fields Available

### ai_requests

- `id`
- `request_type`
- `requested_by`
- `input_payload`
- `status`
- timestamps

### ai_responses

- `id`
- `request_id`
- `status`
- `output_text`
- `model`
- timestamps

## Recommended Durable Feedback Table

Recommended additive table:

- `ai_feedback`

Suggested fields:

- `id`
- `ai_response_id` nullable initially
- `ai_request_id` nullable initially
- `alert_id` nullable overall, but required by the alert explanation feedback route
- `submitted_by`
- `rating`
- `comment`
- `created_at`
- `updated_at`

Optional later fields:

- `feedback_source`
- `was_helpful`
- `correction_note`
- `metadata`

## Why `ai_response_id` Matters

`ai_response_id` is the strongest durable anchor for:

- ownership by `requestedBy`
- per-generation provenance
- analytics across models and outputs

## Why `alert_id` Still Matters

The live route is specifically alert explanation feedback. Without `alert_id`, the current linked-alert authorization seam and alert workbench context become weaker and harder to preserve.

## Nullability Recommendation

### Immediate migration

- `alert_id`: nullable at table level, required by the current alert feedback route
- `ai_response_id`: nullable initially
- `ai_request_id`: nullable initially

### Later migration target

- `ai_response_id` should become required once the frontend and route carry durable response identity

## Required Schema Changes

Yes, durable implementation will require additive schema work.

No current schema supports durable feedback persistence cleanly without a new table.
