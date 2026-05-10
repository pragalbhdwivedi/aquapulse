# Task & Alert Mutation Scope Implementation

## Implemented scope

This pass scopes only:

- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/alerts`
- `PATCH /api/alerts/:id`

## Task mutation behavior

In active authenticated Keycloak mode:

- task create now checks pond responsibility when `pondId` is present
- task update now requires the existing task to be visible through the current assignee-based task read seam
- task update now checks the new pond if `pondId` changes
- out-of-scope existing task updates return not found
- moving a visible task into an unauthorized pond returns forbidden

In local-safe mode:

- task create and update remain broad

## Generic alert mutation behavior

In active authenticated Keycloak mode:

- alert create now checks pond responsibility when `pondId` is present
- generic alert patch still requires the existing alert to be visible through the current assignment seam
- generic alert patch now also checks the new pond if `pondId` changes
- out-of-scope existing alert patch returns not found
- moving a visible alert into an unauthorized pond returns forbidden

In local-safe mode:

- generic alert create and patch remain broad

## Intentionally unchanged

- alert acknowledge/resolve/assign/unassign/review-state routes
- bulk alert triage routes
- alert attach-explanation route
- live-updates bootstrap route
- websocket/live-updates service
- AI feedback
- saved views
- existing read scopes
- frontend contracts and runtime behavior

