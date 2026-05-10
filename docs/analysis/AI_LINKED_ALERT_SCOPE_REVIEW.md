# AI Linked Alert Scope Review

## Current Linked-Alert Availability

The current feedback route is directly linked to alerts through `alertId`.

That makes linked alert scope the strongest currently available bounded authorization seam.

## Existing Alert Visibility Foundation

The repo already has alert visibility and action scoping based on `assignedTo`.

That means the feedback route can reuse an existing internal authorization seam instead of inventing a new model.

## Safe Enforcement Analysis

### Can linked-alert visibility be enforced now?

Yes.

### Why

- `alertId` is present on the current request
- alert visibility checks already exist
- no schema change is needed
- no frontend change is needed
- local-safe broad behavior can remain unchanged

## Recommended Rule

In active authenticated Keycloak mode:

- feedback submission should require that the actor can currently see the linked alert
- missing, unreadable, unsupported, or out-of-scope alert linkage should return not found

In local-safe/mock/disabled mode:

- preserve existing broad behavior

## Interaction With AI Ownership

Linked-alert visibility is the right first enforcement slice.

It is not a complete substitute for future AI response ownership when durable AI feedback persistence becomes real. If a future feedback model links both alert and AI response records, both checks should be enforced together.

## Implementation Risk

Low to medium.

Low because:

- existing alert scope seam can be reused
- no contract change is needed

Medium because:

- the route is live in frontend flows
- any enforcement error convention should stay aligned with existing alert read/detail masking
