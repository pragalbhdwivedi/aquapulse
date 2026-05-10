# Task & Alert Mutation Scope Model

## Scope

This pass finalizes the mutation authorization model for:

- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- alert triage and bulk mutation routes
- `POST /api/ai/alerts/explain/feedback`

No runtime behavior changes are introduced here.

## Task mutation posture

### Current state

- task create and update are authenticated and operator-role protected
- task reads are assignee-scoped in active Keycloak mode
- task writes are not scoped today
- create can set `assigneeId` and `pondId`
- update can change `assigneeId`, `pondId`, `title`, and `status`
- unassigned tasks exist in the in-memory repository

### Model conclusion

Task mutation cannot safely be reduced to only one axis today.

- assignee-only mutation is too narrow for create and reassignment flows
- pond-only mutation is too broad because task ownership is already modeled through assignee-based reads
- both axes matter when `pondId` exists

### Recommended future rule shape

- local-safe remains broad
- create:
  - if `pondId` is present, require pond responsibility for that pond
  - creating a task assigned to someone other than the current actor should be deferred until a clearer role model exists
- update:
  - first require the existing task to be visible to the actor under the current assignee read rule
  - if `pondId` changes, require pond responsibility for the new pond
  - changing `assigneeId` away from self should be deferred until a clearer role model exists

This gives a safe bounded first slice without deciding supervisor/admin task management yet.

## Alert mutation posture

### Current state

- alert triage and lifecycle routes already require assignment visibility in active Keycloak mode
- bulk triage routes already require all targeted alerts to be visible
- `POST /api/alerts` remains broad
- `PATCH /api/alerts/:id` is only partially bounded:
  - it checks current alert visibility
  - but once visible it allows broad field mutation, including `pondId`, `assignedTo`, status, and review fields
- saved-view mutation remains broad and is separate from operational alert integrity

### Model conclusion

Alert mutation should stay split between:

- already-safe assignment-scoped lifecycle/triage actions
- broader create/update authority that still needs more product-model clarity

### Recommended future rule shape

- local-safe remains broad
- triage/lifecycle:
  - keep current assignment-scoped behavior
- create:
  - if `pondId` is present, require pond responsibility
  - broader manual alert creation authority should remain deferred
- update:
  - require existing alert assignment visibility
  - if `pondId` changes, require pond responsibility for the new pond
  - `assignedTo`, `reviewState`, and other reviewer-like fields likely need stricter role treatment later

## AI feedback posture

### Current state

- `POST /api/ai/alerts/explain/feedback` is authenticated and operator-role protected
- controller does not pass requester scope into the application service
- application service delegates to `AlertExplanationService.submitFeedback(...)`
- feedback is stored by `alertId` in the in-memory explanation service
- no check currently confirms:
  - linked alert visibility
  - AI history ownership
  - response ownership

### Model conclusion

AI feedback scoping should be treated as a separate seam from task/alert mutation enforcement.

Recommended future model:

- if feedback is attached to a specific alert explanation, require visibility of the linked alert
- if future persistence ties feedback to AI request/response ownership, also consider `requestedBy`

That is adjacent to alerts, but not the same enforcement slice.

