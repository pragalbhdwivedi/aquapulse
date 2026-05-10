# Alert Generic Mutation Scope Runtime Impact

## Changed runtime path

- alert controller create now forwards requester scope
- alert application-service create validates `pondId` through pond responsibility when present
- generic alert patch keeps the existing assignment visibility gate
- generic alert patch now also validates the new `pondId` if the alert is retargeted

## Unchanged runtime path

- alert triage/lifecycle routes
- bulk triage routes
- live-updates bootstrap and websocket behavior
- alert side effects
- saved views
- frontend contracts

## Notes

- this pass intentionally does not refine assign/unassign/review-state authority
- this pass intentionally does not introduce supervisor/admin or critical-alert logic

