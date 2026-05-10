# Alert Mutation Scope Review

## Surfaces

- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `POST /api/alerts/:id/acknowledge`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/assign`
- `POST /api/alerts/:id/unassign`
- `POST /api/alerts/:id/review-state`
- `POST /api/alerts/:id/attach-explanation`
- bulk acknowledge/resolve/assign/review-state routes

## Current scoped surfaces

Already scoped today:

- `PATCH /api/alerts/:id` for existing-alert visibility only
- acknowledge
- resolve
- assign
- unassign
- review-state
- attach-explanation
- bulk acknowledge
- bulk resolve
- bulk assign
- bulk review-state

These all use `assertAlertVisibleToRequester(...)` or `assertAlertsVisibleToRequester(...)`, which rely on the current assignment-based alert read seam.

## Current broad surfaces

- `POST /api/alerts`
- saved-view mutation routes

Alert creation is still broad for ordinary operators in active Keycloak mode.

## Important nuance on `PATCH /api/alerts/:id`

`PATCH /api/alerts/:id` is not fully modeled yet.

It is bounded for current-alert visibility, but once the alert is visible it still allows mutation of fields including:

- `pondId`
- `assignedTo`
- `status`
- `reviewState`
- `reviewLabel`
- `latestNote`

So the route is partially scoped, not fully authorization-finalized.

## Safe-now rules

- keep existing assignment-scoped triage and lifecycle behavior
- alert create can safely require pond responsibility when `pondId` is present
- alert update can safely require:
  - existing alert assignment visibility
  - new pond responsibility if `pondId` changes

## Rules that still need a future role model

- who can manually create alerts at all
- who can assign alerts to other users
- who can unassign alerts
- who can set review state
- any reviewer/supervisor override
- any special handling for critical alerts

## Recommendation

- do not change alert triage routes first; they are already in the safest shape currently available
- the next alert mutation seam, if implemented, should be alert create and broad patch authority, not triage

## Local-safe

Keep broad.

