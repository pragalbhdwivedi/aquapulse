# AI Response Linkage Runtime Impact

## Runtime Impact

Blast radius is small and limited to the AI alert explanation and feedback compatibility seam.

Touched runtime areas:

- AI controller explain route requester threading
- AI application-service explanation persistence linkage
- AI feedback compatibility parsing

Untouched runtime areas:

- OpenAI explanation generation logic
- alert explanation content generation
- alert lifecycle routes
- alert triage routes
- AI history list/detail scope rules
- durable feedback linked-alert scope rules

## Behavior Change Summary

### `POST /api/ai/alerts/explain`

Now:

- may return `aiResponseId`
- logs `alerts_explain` request/response records when persistence is available

Still:

- returns the same explanation content shape apart from additive optional metadata
- stays compatible when persistence linkage is unavailable

### `POST /api/ai/alerts/explain/feedback`

Now:

- accepts optional durable response linkage
- reuses existing alert visibility checks
- adds response ownership checks only when linkage is present

Still:

- accepts the legacy payload without `aiResponseId`
- preserves local-safe broad behavior

## Frontend Impact

No required frontend change in this slice.

The current UI already stores the explanation response and resubmits it in feedback payloads. Because of that, the backend can begin consuming nested `explanation.aiResponseId` immediately once present.

## Operational Risk

Low.

Reasons:

- additive response metadata only
- no schema change in this slice
- no route removals
- no change to existing auth mode detection
- no change to AI generation output semantics
