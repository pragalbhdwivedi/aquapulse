# AI Authorization Regression Review

## Stable AI Protections

- AI route protection remains on all exposed AI controller handlers
- AI history list/detail remains requester-scoped by `requestedBy`
- alert explanation feedback remains linked-alert-scoped
- durable AI feedback persistence remains in place
- active-auth feedback now always requires `aiResponseId`
- active-auth feedback now always requires owned AI response linkage when `aiResponseId` is supplied

## Feedback Integrity Chain

The current active-auth AI feedback chain is internally consistent:

1. explanation generation may persist a durable AI request/response pair
2. response returns optional `aiResponseId`
3. frontend preserves and sends top-level `aiResponseId`
4. feedback path requires linked alert visibility
5. feedback path requires owned `aiResponseId`
6. durable feedback row stores `alert_id`, optional response/request linkage, and `submitted_by`

## Regression Check

No AI authorization regression was found in:

- history visibility
- feedback visibility
- response ownership enforcement
- local-safe compatibility

## Remaining AI Gaps

- generic `POST /api/ai` and `PATCH /api/ai/:id` remain ordinary operator placeholder routes
- non-feedback AI generation routes are protected but not owner-scoped beyond route protection
- there is still no reviewer/admin AI review model
- if explanation persistence fails in active auth, explanation can still render but feedback will be rejected later for missing `aiResponseId`

## Release Risk

AI authorization risk is low for bounded internal release.

The only notable caveat is the dependency on durable explanation persistence for active-auth feedback hardening.
