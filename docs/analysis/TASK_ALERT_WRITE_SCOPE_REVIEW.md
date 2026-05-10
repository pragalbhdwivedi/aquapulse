# Task and Alert Write Scope Review

## Tasks

### Surfaces

- `POST /api/tasks`
- `PATCH /api/tasks/:id`

### Current behavior

- authenticated and operator-role protected
- no write scoping
- create and update both delegate directly to repository writes

### Available target fields

- `assigneeId`
- `pondId`

### Risk

High. Tasks are already read-scoped by assignee in active auth mode, but writes are still broad.

### Why not scope immediately

Task create/update semantics are still unresolved:

- should operators be able to create tasks for other operators?
- should unassigned tasks exist?
- should pond responsibility gate task creation when `pondId` is present?
- should assignees be able to reassign tasks?

Without a clearer write model, scoping by assignee alone is too narrow and scoping only by pond is too broad.

### Recommendation

- defer task write scoping until a task-write ownership model exists

## Alerts

### Surfaces reviewed

- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `POST /api/alerts/:id/acknowledge`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/assign`
- `POST /api/alerts/:id/unassign`
- `POST /api/alerts/:id/review-state`
- `POST /api/alerts/:id/attach-explanation`
- bulk alert lifecycle and triage routes
- saved view mutation routes

### Current behavior

- alert detail, triage, explanation attach, and bulk triage routes already assert assignment-scoped visibility in Keycloak mode
- generic alert create is broad
- generic alert update is only partially bounded: it checks current alert visibility first, but then still allows broad field edits
- saved view create/remove remains broad and is not owner-scoped

### Available target fields

- `pondId`
- `assignedTo`
- alert id for lifecycle and triage routes

### Risk split

- triage/lifecycle routes: medium, because they already require visible assigned-alert scope
- generic `POST /api/alerts`: high, because manual creation is broad and overlaps with runtime-generated operational alerts
- generic `PATCH /api/alerts/:id`: medium-high, because a visible assigned alert can still be broadly patched
- saved views: medium, but this is not pond-linked operational integrity

### Recommendation

- keep the current triage/lifecycle scope seam
- do not expand alert write hardening blindly yet
- defer manual alert create/update authority until there is a clearer product rule for operator vs supervisor vs system-generated alert changes

## AI and audit verification notes

- audit mutation routes remain correctly restricted in active Keycloak mode
- AI feedback is still a write-like seam that should eventually validate linked-alert visibility
- generic `POST /api/ai` and `PATCH /api/ai/:id` still look like scaffolding and should be reviewed separately from pond-linked operational writes

