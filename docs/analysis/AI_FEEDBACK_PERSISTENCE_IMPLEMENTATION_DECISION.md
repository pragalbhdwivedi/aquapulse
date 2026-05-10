# AI Feedback Persistence Implementation Decision

## Decision Summary

Durable AI feedback can be implemented, but the safest first durable slice is a compatibility model rather than a fully response-owned model.

## Final Recommendation

### Recommended linkage model

Use a compatibility migration:

- `alert_id` required for the current alert explanation feedback route
- `ai_response_id` optional initially
- `ai_request_id` optional initially
- `submitted_by` required
- later migrate toward `ai_response_id` required

This is Model D on the way to Model C.

## Answers To The Key Questions

### Should durable feedback link to `ai_response_id`?

Yes.

### Should durable feedback link to `ai_request_id`?

Optional but useful for denormalized analytics and debugging. The primary durable linkage should still be `ai_response_id`.

### Should durable feedback also store `alert_id`?

Yes, for alert explanation feedback.

### Should feedback require AI response ownership by `requestedBy`?

Yes, when `ai_response_id` is present.

### Should feedback require linked alert visibility?

Yes, when `alert_id` is present.

### If both are present, should both checks be required?

Yes.

### Should `ai_response_id` be required now or later?

Later.

The current frontend contract does not provide it reliably.

### Should `alert_id` remain required for alert feedback?

Yes.

## Required Changes Later

### Schema

- add durable `ai_feedback` table

### API contract

- no required change for the first compatibility persistence slice
- later additive contract support for `aiResponseId`
- later required `aiResponseId` after frontend migration

### Frontend

- none for compatibility persistence
- later small migration to send `aiResponseId`

## Local-Safe Recommendation

Local-safe should remain broad.

Placeholder/in-memory behavior may remain available in local mode even after durable persistence is added in active auth flows.

## First Safe Implementation Slice

1. Add durable `ai_feedback` persistence with compatibility fields.
2. Preserve current route shape and behavior.
3. Persist alert-linked feedback with `submitted_by`.
4. Reuse existing linked-alert visibility enforcement.
5. Defer response ownership enforcement until `aiResponseId` is carried reliably.

## Do Not Modify Yet

- AI generation/runtime behavior
- alert lifecycle behavior
- reviewer/admin override rules
- cross-user AI review workflows
- dashboards/analytics UIs
- prompt governance surfaces

## Recommended Timing

- compatibility persistence: safe next slice
- required response ownership: later coordinated slice after contract/frontend migration
