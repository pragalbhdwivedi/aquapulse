# AI Feedback Implementation Decision

## Decision

AI feedback authorization should be implemented as a separate bounded seam.

## Final Model

### Immediate enforceable model

In active authenticated Keycloak mode:

- `POST /api/ai/alerts/explain/feedback` should require visibility of the linked alert
- out-of-scope linked alerts should return not found
- local-safe/mock/disabled mode should remain broad

### Deferred model

- requestedBy ownership enforcement for durable AI response feedback
- dual validation of AI response ownership and linked-alert visibility when both links exist
- durable AI feedback persistence
- reviewer/admin override or review visibility
- AI quality dashboards and cross-user review flows

## Answers To The Key Decisions

### Can feedback be safely scoped now?

Yes, but only by linked alert visibility.

### Should feedback be scoped by `requestedBy`?

Long term yes for durable AI-response feedback, but not as the first enforceable rule on the current alert explanation feedback route.

### Should feedback be scoped by linked alert visibility?

Yes. This is the safest first implementation slice.

### Are both checks required?

Not for the first slice. Later, yes, if the system durably links feedback to both an AI response/request record and an alert record.

### Are schema changes required?

No for the first linked-alert visibility slice.

Potentially yes later if durable response-linked ownership and richer review workflows are added.

### Are frontend changes required?

No for the first linked-alert visibility slice.

## What Should Not Be Modified Yet

- AI generation behavior
- alert lifecycle/triage behavior
- AI response persistence design
- reviewer/admin override logic
- cross-user AI review workflows
- prompt governance surfaces
- dashboards or analytics based on feedback

## First Safe Implementation Slice

Implement only:

- active-auth linked-alert visibility enforcement for `POST /api/ai/alerts/explain/feedback`
- not-found masking for out-of-scope linked alerts
- preserved local-safe broad behavior

Do not combine that with durable feedback persistence work in the same change.
