# Audit Scope Runtime Impact

## Summary

This pass narrows audit history visibility only for active authenticated Keycloak operators using the existing `audit_event_metadata.actor_id` field.

It does not change:

- audit write behavior
- audit interceptor behavior
- audit schema
- frontend contracts
- local-safe broad behavior

## Runtime Impact

In Keycloak mode:

- `GET /api/audit` now returns only actor-owned audit rows
- `GET /api/audit/:id` now hides out-of-scope rows behind not found
- metadata-less rows are not visible to normal operators

In local and disabled modes:

- broad audit visibility remains unchanged

## Frontend Impact

No frontend code changes were required.

Current frontend audit behavior is still:

- placeholder page
- list-only query path
- count-style rendering

The only possible user-visible change in active auth is a reduced audit count.

## Local-Safe Compatibility

Local-safe remains intentionally broad.

That preserves:

- development flows
- demo behavior
- mock stability

## Blast Radius

Limited to:

- audit controller read path
- audit application-service read path
- audit repository list filtering
- in-memory audit read fixtures
- focused audit read-scope tests

Not touched:

- audit POST/PATCH
- audit interceptor
- audit persistence writes
- frontend audit UI
- shared contract packages

## Metadata-Less Row Handling

Metadata-less rows remain present in storage behavior, but in Keycloak-scoped reads they are now hidden from normal operators because they cannot satisfy the actor-based scope rule.

This is intentional and safer than exposing rows whose authorship cannot be validated through the existing bounded metadata seam.

## Remaining Visibility Gaps

- no elevated reviewer/admin view
- no supervisor cross-operator view
- no scoped export/reporting model
- no self-auditing for audit access
- broad audit mutation routes still exist

## Validation Notes

The implementation preserves:

- API response shapes
- local-safe broad behavior
- existing frontend stability
- audit write behavior

Validation target for this pass:

- api typecheck
- web typecheck
- contract tests
