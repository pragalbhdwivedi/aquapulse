# AI Response Linkage Implementation Decision

## Answers

### Is `aiResponseId` already available after explanation generation?

No.

The current alert explanation response does not return durable request/response IDs.

### Does the frontend currently receive or preserve `aiResponseId`?

No.

It stores the explanation object, but that object currently contains no durable response identity.

### Can the feedback DTO accept optional `aiResponseId` now?

Conceptually yes as a staged additive change, but the official public contract does not model it yet.

### Does rollout require API contract changes?

Yes, for Stage 1 if `aiResponseId` is surfaced officially.

Those changes should be additive first, not breaking.

### Does rollout require frontend changes?

Yes, for Stage 2.

The frontend must preserve and resend `aiResponseId`.

## Recommended Rollout

1. Stage 1: backend-compatible additive `aiResponseId`
2. Stage 2: frontend stores and sends it
3. Stage 3: backend requires it in active auth

## First Safe Implementation Slice

Backend-compatible additive support only:

- explanation response returns optional `aiResponseId`
- feedback payload accepts optional `aiResponseId`
- current clients remain valid

## What Must Stay Backward-Compatible

- feedback submission without `aiResponseId`
- local-safe/mock explanation flows
- current workbench feedback UX
- existing linked-alert visibility enforcement

## What Should Not Be Modified Yet

- AI generation semantics
- feedback persistence schema again
- alert lifecycle behavior
- reviewer/admin overrides
- dashboards or analytics
- prompt governance surfaces
