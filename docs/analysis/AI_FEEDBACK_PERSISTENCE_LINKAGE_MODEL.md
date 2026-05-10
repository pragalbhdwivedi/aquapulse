# AI Feedback Persistence Linkage Model

## Current Durable Readiness

Current durable AI feedback readiness is about `35%`.

Why:

- durable AI request/response tables already exist
- AI history ownership by `requestedBy` already exists
- alert-linked feedback authorization already exists
- a generic `AiFeedbackRecord` shape already exists
- but the live feedback route still uses an alert-scoped placeholder contract and in-memory storage

## Current State

### Live feedback route

`POST /api/ai/alerts/explain/feedback` currently sends:

- `alertId`
- `value`
- `note`
- `explanation`

It does not currently send:

- `aiResponseId`
- `aiRequestId`

### Durable AI persistence that already exists

Existing persisted tables:

- `ai_requests`
- `ai_responses`

Existing durable ownership seam:

- `ai_requests.requested_by`

### Feedback persistence that exists today

- alert explanation feedback is still stored in-memory by `alertId`
- generic `AiRepositoryPort.saveFeedbackRecord(...)` and `listFeedback(...)` exist, but remain placeholder-backed

## Model Options

### Model A: alertId only

Security strength:

- medium

Pros:

- fully compatible with the current route
- reuses linked-alert visibility
- no immediate frontend change needed

Cons:

- no durable AI response ownership
- cannot distinguish feedback across multiple explanation generations for the same alert
- weaker analytics and provenance

Timing:

- safe as a compatibility bridge, not the preferred final model

### Model B: aiResponseId only

Security strength:

- high for AI ownership

Pros:

- aligns with existing `AiFeedbackRecord`
- ties feedback to a concrete response
- enables `requestedBy` ownership enforcement

Cons:

- current frontend route does not provide `aiResponseId`
- weak for alert-linked review workflows unless alert linkage is inferred indirectly

Timing:

- not safe as the first migration step for the current alert explanation route

### Model C: both alertId and aiResponseId

Security strength:

- highest

Pros:

- supports both linked-alert visibility and AI response ownership
- strongest provenance for review and analytics
- future-safe for multi-surface AI feedback

Cons:

- current route/frontend do not fully provide durable response linkage
- requires additive schema and likely later contract migration

Timing:

- preferred long-term durable model

### Model D: compatibility migration

- `alertId` required now
- `aiResponseId` optional initially
- `aiResponseId` required later

Security strength:

- medium now, high later

Pros:

- backward-compatible
- lets durable persistence start before the frontend sends response identity
- supports staged migration without breaking the live route

Cons:

- mixed-quality records during the transition
- dual-path enforcement logic needed temporarily

Timing:

- best immediate durable migration path

## Recommended Model

Recommend Model D as the implementation path, with Model C as the long-term target.

### Immediate durable model

Persist a durable feedback record that supports:

- alert-linked authorization now
- response-linked ownership later

### Long-term model

Durable feedback should ultimately link to both:

- `ai_response_id`
- `alert_id` for alert explanation feedback

When both are present, both checks should be required.
