# Audit Mutation Runtime Impact

## Summary

This pass restricts public audit mutation routes only in active authenticated Keycloak mode.

It does not change:

- audit read-scope behavior
- interceptor/runtime-recorder writes
- audit persistence schema
- frontend runtime behavior
- local-safe development behavior

## Runtime Impact

In Keycloak mode:

- `POST /api/audit` now rejects ordinary operator mutation attempts
- `PATCH /api/audit/:id` now rejects ordinary operator mutation attempts

In local and non-enforcing modes:

- audit mutation routes remain available

## Read-Scope Impact

None.

Current actor-scoped audit list/detail behavior remains unchanged.

## Interceptor And Runtime Recorder Impact

None.

The trusted runtime audit-write path still works the same way:

- interceptor captures event plus metadata
- runtime recorder persists it

This hardening only affects the public manual mutation seam.

## Frontend Impact

None expected.

The frontend does not currently expose audit create/update behavior.

## Blast Radius

Limited to:

- audit controller mutation handlers
- audit application-service mutation checks
- focused audit mutation tests
- bounded analysis docs

## Remaining Audit Integrity Gaps

- routes still exist for local-safe and structural compatibility
- no admin-only correction path exists yet
- no self-auditing of audit access
- no immutable retention workflow

## Safe Next Seam

If AquaPulse wants to keep the audit mutation endpoints present long-term, the next safe seam would be an explicitly modeled internal/admin-only correction policy. Otherwise, the stronger long-term direction is to leave audit writes to the interceptor/runtime-recorder path only.
