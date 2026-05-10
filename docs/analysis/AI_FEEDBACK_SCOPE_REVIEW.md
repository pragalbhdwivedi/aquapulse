# AI Feedback Scope Review

## Surface

- `POST /api/ai/alerts/explain/feedback`

## Current behavior

- route is authenticated and operator-role protected
- controller does not provide requester scope to `AiApplicationService.submitAlertExplanationFeedback(...)`
- application service delegates directly to `AlertExplanationService.submitFeedback(...)`
- feedback is accepted based on payload contents only
- current in-memory explanation service stores feedback keyed by `alertId`

## Current scope relation

This route is not currently coupled to:

- AI history `requestedBy`
- linked alert assignment visibility
- linked alert pond responsibility

So a Keycloak operator could submit explanation feedback for a payload tied to an alert that is not currently visible to them, if they can construct the request.

## Schema/support readiness

No schema change is required to require linked-alert visibility, because the payload already carries `alertId`.

However, AI feedback still deserves separate treatment because:

- it is not a task mutation
- it is not an alert lifecycle mutation
- it may later want both alert visibility and AI-response ownership

## Recommendation

- keep AI feedback scoping separate from task/alert mutation implementation
- likely future rule:
  - require linked-alert visibility first
  - later consider AI-response/request ownership if the product starts exposing persistent feedback histories

## Frontend impact expectation

Low to moderate. The alerts workbench currently uses this route.

