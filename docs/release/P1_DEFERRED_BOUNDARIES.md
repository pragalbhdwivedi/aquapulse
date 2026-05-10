# P1 Deferred Boundaries

## Explicitly Deferred

- alerts live-updates assignment scoping
- per-user websocket delivery
- saved-view ownership or sharing model
- attachment file-content or download authorization if such a route is added later
- pond write authority refinement
- batch write authority refinement
- attachment write authority refinement
- supervisor/admin authorization overrides
- reviewer/admin AI feedback review workflow
- AI quality dashboards
- compliance export workflows
- audit self-auditing or access-self-auditing

## What Reviewers Must Not Assume

- live updates are production-safe
- saved views are private to the current operator
- attachment file downloads exist
- reviewer/admin override flows exist
- alert feedback in active Keycloak mode works without `aiResponseId`

## Live Updates Boundary

Live updates are:

- disabled by default
- enabled only by explicit config
- authenticated when enabled
- not assignment-scoped yet

For this reason, they are outside the default bounded internal rollout.
