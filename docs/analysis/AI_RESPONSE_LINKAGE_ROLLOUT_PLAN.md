# AI Response Linkage Rollout Plan

## Current Readiness

Current response-linkage readiness is about `25%`.

Why:

- durable `ai_requests`, `ai_responses`, and `ai_feedback` exist
- feedback persistence can already store nullable `ai_response_id`
- feedback authorization can already enforce response ownership if `aiResponseId` is present
- but alert explanation generation does not currently return durable response identity
- frontend does not currently receive or preserve that identity

## Current Flow Reality

### Explanation generation

`POST /api/ai/alerts/explain` currently returns:

- explanation text
- metadata
- cache state
- feedback summary

It does not currently return:

- `aiResponseId`
- `aiRequestId`

### Feedback submission

`POST /api/ai/alerts/explain/feedback` currently accepts:

- `alertId`
- `value`
- `note`
- `explanation`

The backend compatibility seam can detect optional `aiResponseId` if it appears, but the public contract does not reliably provide it today.

## Recommended Stages

### Stage 1: backend-compatible response linkage

- extend alert explanation response to include optional durable response identity
- extend feedback payload compatibility to accept optional `aiResponseId`
- if `aiResponseId` is present, enforce AI response ownership
- if absent, preserve current alert-only compatibility

### Stage 2: frontend adoption

- frontend stores `aiResponseId` in explanation state
- frontend sends `aiResponseId` during feedback submission
- local-safe/mock flows remain broad

### Stage 3: hardening

- require `aiResponseId` for alert feedback in active authenticated mode
- require both linked alert visibility and AI response ownership
- keep local-safe broad

## First Safe Slice

The first safe slice is Stage 1 only.

That means:

- explanation response gains optional response linkage
- feedback remains backward-compatible
- current frontend continues working unchanged until it is updated
