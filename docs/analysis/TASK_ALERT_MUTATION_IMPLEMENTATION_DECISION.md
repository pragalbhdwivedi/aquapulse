# Task & Alert Mutation Implementation Decision

## Task mutation maturity

Approximate maturity: 20%.

Why:

- route-level protection exists
- no task mutation scoping exists
- task reads already create a bounded assignee seam that writes can build on

## Alert mutation maturity

Approximate maturity: 60%.

Why:

- route-level protection exists
- triage and lifecycle actions already use assignment-scoped visibility
- bulk actions are also bounded
- but create is still broad and generic patch authority is still only partially finalized

## Safe rules to implement later

### Tasks

- create: require pond responsibility if `pondId` exists
- update: require existing task visibility by assignee
- update: if `pondId` changes, require pond responsibility for the new pond

### Alerts

- create: require pond responsibility if `pondId` exists
- update: require existing alert assignment visibility
- update: if `pondId` changes, require pond responsibility for the new pond

## Rules needing schema support

None are blocked by schema first.

The main blockers are product-model and role-model clarity, not missing columns.

## Rules needing future role model

- task creation assigned to other users
- task reassignment to other users
- supervisor/admin task management
- manual alert creation authority beyond pond check
- alert assign/unassign authority refinement
- alert review-state authority refinement
- critical-alert special handling
- reviewer/supervisor/admin overrides

## AI feedback

AI feedback scoping should be handled separately.

It is adjacent to alerts but should not be coupled into the first task/alert mutation slice. The likely future model is linked-alert visibility first, with optional AI-history ownership rules later.

## Local-safe

Keep broad.

## First safe implementation slice

1. task create/update bounded by existing assignee visibility plus pond responsibility where applicable
2. alert create/update bounded by current assignment visibility plus pond responsibility where applicable

Do not combine that with reviewer-role expansion or AI feedback in the same first pass.

## Do not modify yet

- alert triage/lifecycle route behavior
- alert live updates/websocket behavior
- AI feedback route
- supervisor/admin override logic
- saved-view mutation ownership

