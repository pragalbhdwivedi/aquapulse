# AI Feedback Route Review

## Reviewed Route

- `POST /api/ai/alerts/explain/feedback`

## Current Behavior

- route is authenticated and operator protected
- controller maps the DTO and delegates to `AiApplicationService.submitAlertExplanationFeedback(...)`
- application service delegates to `AlertExplanationService.submitFeedback(...)` when explanation support is enabled
- fallback behavior returns a bounded response object without durable validation against AI history ownership

## Current Caller

The route is actively used by the frontend alerts workbench explanation feedback flow.

That means:

- this is not dead scaffolding
- contract stability matters
- frontend changes should be avoided for the first authorization slice

## Current Scope Fields Available

Clearly available today:

- `alertId`
- `value`
- `note`
- `explanation`

Not clearly available on the route path:

- durable `aiResponseId`
- durable `aiRequestId`
- durable `requestedBy`

## Current Read-Scope Relation

The route is semantically tied to alert explanation UX, so the nearest trustworthy authorization seam is linked alert visibility.

It is not currently tied to AI history ownership in a durable way.

## Enforcement Feasibility

### Safe now

- check whether the requester can see the linked alert
- reject out-of-scope alert feedback with not found

### Not safe as the only immediate rule

- requestedBy-only enforcement on this route

Reason:

the current route shape and service path do not reliably identify a persisted AI response/request record to prove ownership.

## Risk

Current risk is moderate:

- feedback can be submitted for an `alertId` without reusing alert visibility scope
- route remains bounded by authentication, but not by linked-resource authorization
- placeholder storage reduces blast radius, but not the authorization gap

## Recommendation

First implementation slice:

- keep route and response shape unchanged
- in active Keycloak mode require linked-alert visibility
- preserve local-safe broad behavior
- defer response-ownership enforcement until the feedback flow is durably bound to a stored AI response/request seam
