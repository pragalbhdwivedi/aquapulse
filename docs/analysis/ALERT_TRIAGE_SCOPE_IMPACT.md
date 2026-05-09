# Alert Triage Scope Impact

## Single-Alert Triage

These routes now verify that the target alert is assigned to the current Keycloak-backed operator before any mutation runs:

- acknowledge
- resolve
- assign
- unassign
- review-state
- attach explanation
- patch update

If the alert is outside the operator's visible assignment scope, the route returns not found and does not mutate the record.

## Bulk Triage

These routes now verify every requested alert id before mutation:

- bulk acknowledge
- bulk resolve
- bulk assign
- bulk review-state

If any requested alert falls outside the caller's assignment scope, the bulk operation is rejected before mutation so the route does not become a bypass path.

## Intentionally Deferred

- role-based override paths
- cross-pond critical alert visibility
- websocket-scoped triage delivery
- saved-view scope alignment
- unassigned-alert shared queue rules in active authenticated mode
