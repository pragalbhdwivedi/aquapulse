# Audit History Read Scope By Actor Implementation

## Summary

This pass implements only the first bounded audit history read-scope slice:

- scope `GET /api/audit` by `actor_id` in active authenticated Keycloak mode
- scope `GET /api/audit/:id` by the same actor-based rule
- return not found for out-of-scope detail
- hide metadata-less rows from normal operators in active auth mode
- preserve local-safe broad behavior

Out of scope:

- audit create/update route changes
- interceptor changes
- persistence write changes
- schema changes
- reviewer/admin/supervisor audit visibility
- compliance export access
- audit access self-auditing
- frontend changes

## What Changed

### Controller read path

`AuditController` now threads the existing authenticated requester into:

- `AuditApplicationService.list()`
- `AuditApplicationService.getById()`

using the same bounded `{ id, provider }` shape already used by AI and task read scoping.

### Application-service enforcement

`AuditApplicationService` now:

- scopes list reads by `actorId` when the requester is a Keycloak user
- performs scoped detail lookup via the repository list path
- returns `NotFoundException` for out-of-scope detail
- preserves broad reads for local mode and other non-enforcing modes

### Repository read filtering

`PostgresAuditRepository.list()` now supports internal read filters for:

- `auditId`
- `actorId`

When `actorId` is present:

- the query uses `audit_event_metadata`
- only rows whose metadata `actor_id` matches the requester are returned
- rows with no metadata row or no matching `actor_id` are excluded

The broad `getById()` path was intentionally left unchanged so local-safe and disabled-mode behavior stay stable.

### In-memory test seam

The in-memory audit repository now includes:

- actor-owned sample events
- a metadata-less sample event

That gives the service-level tests a stable seam for:

- matching actor visibility
- cross-actor rejection
- metadata-less row hiding
- local-safe broad behavior

## Resulting Behavior

In Keycloak mode:

- audit list returns only the requesting operator's actor-owned rows
- audit detail returns only if that row is actor-owned
- out-of-scope or metadata-less detail returns not found

In local mode:

- audit list remains broad
- audit detail remains broad

## Why This Is Safe

- no write-path behavior changed
- no schema changed
- no shared contract changed
- no frontend behavior changed
- the scoping rule is limited to active authenticated reads
- list and detail now use the same scope anchor

## Remaining Gaps

- no owner/admin all-audit visibility
- no supervisor cross-operator visibility
- no module-level audit review visibility
- no audit-access self-auditing
- public audit mutation routes are still broad and still do not guarantee actor metadata

## Recommended Next Safe Seam

The next safe follow-up should be audit mutation-route restriction analysis or implementation, because the read model is now bounded but public audit create/update routes still do not align cleanly with actor-backed audit visibility.
