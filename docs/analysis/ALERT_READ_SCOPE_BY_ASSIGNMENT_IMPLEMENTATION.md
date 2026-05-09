# Alert Read Scope By Assignment Implementation

## Scope Added

This pass adds the first bounded alert visibility enforcement seam in active authenticated mode only.

Applied surfaces:

- `GET /api/alerts`
- `GET /api/alerts/:id`
- `GET /api/alerts/summary`
- `PATCH /api/alerts/:id`
- `POST /api/alerts/:id/acknowledge`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/assign`
- `POST /api/alerts/:id/unassign`
- `POST /api/alerts/:id/review-state`
- `POST /api/alerts/:id/attach-explanation`
- `POST /api/alerts/bulk/acknowledge`
- `POST /api/alerts/bulk/resolve`
- `POST /api/alerts/bulk/assign`
- `POST /api/alerts/bulk/review-state`

## Enforcement Model

- Keycloak-backed operators only see alerts where `assignedTo === current user id`.
- Alert detail reads use the same assignment rule as list reads.
- Alert summary is derived from the same scoped alert set.
- Single-alert triage and update routes first verify assignment visibility before mutation.
- Bulk triage verifies every requested alert is visible before mutation.
- Out-of-scope detail and action attempts return not found.

## Intentionally Unchanged

- local-safe and disabled-mode alert visibility
- saved views
- live-updates bootstrap route
- websocket delivery model
- alert creation behavior
- broader pond, supervisor, or admin visibility

## Internal Implementation Notes

- No shared public contract was changed.
- The internal alerts query contract now supports `alertId` for scoped detail checks.
- The repository query layer reuses existing `assignedTo` filtering instead of adding a new authorization system.
