# AI Feedback Scope Model

## Purpose

Finalize the safest future authorization model for AI feedback before enforcement.

## Current Surface

Primary write-like surface reviewed:

- `POST /api/ai/alerts/explain/feedback`

Related supporting seams reviewed:

- AI history list/detail read scope by `requestedBy`
- Alert visibility/action scope by `assignedTo`
- Alert explanation generation/cache path
- Placeholder AI feedback repository methods
- Frontend alert explanation feedback UI

## Current Maturity

- AI feedback authorization maturity: `15%`
- AI feedback persistence maturity: `15%`

Why:

- Route protection exists, but scoped authorization does not.
- Feedback is currently keyed by `alertId`, not by a durable AI response ownership seam.
- The current feedback path uses in-memory placeholder storage, not durable persistence.

## Current Repo Facts

### Feedback route linkage

The feedback DTO and controller path clearly carry:

- `alertId`
- `value`
- `note`
- `explanation`

The route does **not** currently require or carry:

- `aiResponseId`
- `aiRequestId`
- `requestedBy`

### AI ownership foundation

AI history read scoping already exists by `requestedBy`, but that seam is attached to persisted AI request/response history reads, not to the feedback route.

### Alert visibility foundation

Alert read/action visibility already exists by `assignedTo`, and that is the only currently reliable bounded authorization seam available to the feedback route today.

### Persistence maturity

The active explanation feedback path stores latest feedback in an in-memory map in `AlertExplanationService`.

The broader AI repository interface exposes:

- `saveFeedbackRecord(record)`
- `listFeedback(query)`

but the current feedback route does not use a durable feedback persistence path.

## Recommended Authorization Model

### Immediate safe model

In active authenticated Keycloak mode:

- feedback submission for alert explanations should require visibility of the linked alert
- if the linked alert is out of scope, missing, or not readable, return not found
- local-safe/mock/disabled mode should remain broad

### Why this is the safest first rule

`alertId` is present today and can be validated against an already-implemented alert visibility seam. That makes linked-alert scope enforceable now without changing contracts or schema.

### Requested-by ownership model

Ownership by `requestedBy` is the right long-term model for generic AI history feedback, but it is **not** a fully reliable first enforcement seam for the current alert explanation feedback route because the route is not durably bound to an AI response/request identity today.

### If both linkages exist later

If a future feedback route or durable record links both:

- AI response/request ownership, and
- linked alert identity

then both checks should be required where both links are present.

## Safe Now vs Deferred

### Safe now

- require linked-alert visibility for `POST /api/ai/alerts/explain/feedback`
- preserve local-safe broad behavior
- keep error masking aligned with existing read-scope conventions

### Deferred

- feedback ownership by persisted AI response `requestedBy`
- reviewer/admin feedback visibility
- cross-user AI review workflow
- durable feedback persistence redesign
- AI quality dashboards

## Not-Found vs Forbidden

Recommendation:

- for out-of-scope linked alert feedback submission, prefer `not found`
- use `forbidden` only for route-level operator blocking where the project already uses that pattern

This keeps feedback authorization aligned with existing bounded read/detail protections and avoids leaking alert existence.
