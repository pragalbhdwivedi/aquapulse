# AI Response Linkage Backend Compatibility Implementation

## Scope

This slice implements Stage 1 backend compatibility for alert explanation response linkage.

Changed paths only:

- `POST /api/ai/alerts/explain`
- `POST /api/ai/alerts/explain/feedback`
- AI application-service linkage persistence path
- focused tests

Unchanged:

- frontend behavior
- AI generation semantics
- alert lifecycle and triage behavior
- durable feedback schema shape beyond existing compatibility fields
- linked-alert visibility enforcement

## What Was Added

### 1. Optional `aiResponseId` on alert explanations

When the backend successfully persists an `alerts_explain` request/response pair, the response now includes:

- `aiResponseId?: string`

This field is additive and optional. If durable linkage cannot be recorded, the explanation response remains valid and omits the field.

### 2. Durable `alerts_explain` request/response logging

The backend now logs alert explanation generations through the existing AI request/response persistence seam:

- `ai_requests.request_type = "alerts_explain"`
- `ai_requests.requested_by` populated from the current requester when available
- `ai_responses.id` reused as the returned `aiResponseId`

The response record stores the explanation payload including the generated `aiResponseId`.

### 3. Optional feedback linkage intake

Feedback now accepts optional durable linkage without breaking the current payload shape.

Accepted compatibility paths:

- top-level `aiResponseId`
- nested `explanation.aiResponseId`

The nested path matters because the current frontend already resends the full explanation object during feedback submission.

## Authorization Behavior

Active authenticated Keycloak mode:

- linked alert visibility is still required first
- if `aiResponseId` is present, AI response ownership is also required
- if both identifiers are present, both checks must pass
- out-of-scope AI response linkage returns not found

Local-safe/mock/disabled mode:

- broad behavior remains preserved
- optional linkage can still persist when repository support is available

## Compatibility Notes

- existing feedback payloads without `aiResponseId` still work
- explanation consumers do not need to read `aiResponseId`
- no frontend migration is required for this backend slice
- if a client supplies both `aiResponseId` and `aiRequestId`, persisted request linkage now prefers the request ID derived from the owned response

## Tests Added Or Covered

- explanation returns optional `aiResponseId` when durable linkage succeeds
- explanation remains compatible when linkage persistence is unavailable
- feedback still works without explicit top-level `aiResponseId`
- feedback accepts durable linkage through the nested explanation payload
- response ownership still blocks out-of-scope `aiResponseId`
- existing adapter, controller envelope, and persistence tests still pass
