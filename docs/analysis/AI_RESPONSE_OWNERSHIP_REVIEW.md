# AI Response Ownership Review

## Current Ownership Foundation

AI history reads already have a bounded ownership seam:

- request/response logs are scoped by `requestedBy`

That foundation is mature enough for AI history list/detail reads.

## Current Feedback Gap

The alert explanation feedback route does not currently carry or resolve a durable AI response identity.

Current path reviewed:

- controller accepts `alertId`, `value`, `note`, `explanation`
- application service forwards the request
- explanation service stores latest feedback by `alertId`

Because of that, the current feedback flow cannot reliably answer:

- which persisted AI response is being reviewed
- who originally requested that response

## Repository Maturity

The AI repository contract already has placeholder feedback methods and durable request/response records:

- `saveFeedbackRecord(record)`
- `listFeedback(query)`
- `ai_requests.requested_by`
- `ai_responses.request_id`

But the current alert explanation feedback route is not wired through those durable response ownership records.

## Ownership Enforcement Decision

### Can feedback be safely scoped by `requestedBy` now?

Not as the primary immediate enforcement rule for the current alert explanation route.

### Why not

- no required `responseId` on the route
- no guaranteed request/response lookup in the service path
- no durable ownership check on the active feedback write seam

## Long-Term Model

For generic AI response feedback or future durable explanation feedback:

- feedback should require ownership of the linked AI response by `requestedBy`
- if both AI response ownership and linked alert visibility exist, both should pass

## Schema/Frontend Impact

RequestedBy-based enforcement for the current route would likely need either:

- a durable feedback persistence link to `responseId`, or
- a contract change that supplies durable response identity

That means it should be deferred from the first enforcement slice.
