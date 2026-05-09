# Audit History Scope Finalization

## Purpose

This document finalizes the bounded read-scope model for audit history without changing runtime behavior in this analysis pass.

Repo evidence reviewed:

- `apps/api/src/modules/audit/audit.controller.ts`
- `apps/api/src/modules/audit/application/audit.application-service.ts`
- `apps/api/src/modules/audit/adapters/postgres-audit.repository.ts`
- `apps/api/src/modules/audit/repositories/in-memory-audit.repository.ts`
- `apps/api/src/common/audit/placeholder-audit.interceptor.ts`
- `apps/api/src/common/request-metadata.ts`
- `packages/database/migrations/0002_audit_persistence_foundation.sql`
- `apps/web/app/(protected)/audit/page.tsx`
- `apps/web/src/queries/index.ts`
- `apps/web/src/repositories/index.ts`

## Current State

### Backend routes

- `GET /api/audit`
- `GET /api/audit/:id`
- `POST /api/audit`
- `PATCH /api/audit/:id`

All four routes are currently protected by:

- `@RequireAuthentication()`
- `@RequireRoles("operator")`

That means:

- in Keycloak mode, any authenticated operator can call them
- in local mode, the deterministic local operator can call them
- in disabled mode, auth enforcement is bypassed

### Audit read behavior

The audit application service currently passes list and detail reads straight through to the repository. It does not apply ownership, role-scoped filtering, or not-found masking today.

The Postgres repository currently reads only from `audit_events` for list and detail. It does not join `audit_event_metadata`, so current reads do not use:

- `actor_id`
- `request_id`
- `correlation_id`
- `request_path`
- `http_method`
- `status_code`

### Audit persistence shape

Current durable schema:

- `audit_events`
  - `id`
  - `action`
  - `resource_type`
  - `resource_id`
  - `summary`
  - `created_at`
  - `updated_at`
- `audit_event_metadata`
  - `id`
  - `audit_event_id`
  - `request_id`
  - `correlation_id`
  - `actor_id`
  - `http_method`
  - `request_path`
  - `status_code`
  - `created_at`
  - `updated_at`

Important observation:

- `actor_id` already exists in durable storage and is indexed
- runtime interceptor-generated audit writes persist `actor_id` from `request.user.id`
- public `POST /api/audit` and `PATCH /api/audit/:id` writes currently call `saveEvent()` without metadata, so those rows are not guaranteed to have `actor_id`

### Interceptor behavior

The placeholder audit interceptor:

- derives `resourceType` and `resourceId` from the request path
- maps request method to an audit action
- writes metadata with `actorId`, `requestId`, `correlationId`, `requestPath`, `httpMethod`, and `statusCode`
- intentionally skips `/api/audit` requests to avoid recursive self-logging

### Repository fallback behavior

Current audit repository behavior is broad and placeholder-oriented:

- `getById()` returns a placeholder event when no row is found
- `list()` returns a placeholder event when no rows are found in the Postgres adapter
- the in-memory audit repository always returns a shared placeholder audit event

This matters for future scoping:

- scoped detail cannot safely depend on the current broad `getById()` alone
- a future scoped detail path must validate visibility before returning any record
- out-of-scope detail should not leak record existence

## Sensitivity Assessment

Audit history is a very high sensitivity surface because it may expose:

- operator actions
- request paths and route usage patterns
- internal identifiers
- cross-module operational behavior
- AI-related activity
- timing and workflow sequencing

This surface is more sensitive than AI history, tasks, or assigned alerts because the same event stream can reveal behavior across many modules.

## Final Recommended Visibility Model

### Immediate enforceable model

In active authenticated mode:

- normal operators may read only audit events whose `actor_id` matches their current authenticated identity
- list and detail must use the same actor-based rule
- out-of-scope detail must return not found
- rows without a matching `actor_id` should not be visible to normal operators

In local-safe mode:

- keep audit history broad and unchanged for demos, mock flows, and development

In disabled mode:

- keep the current broad non-enforcing behavior unless and until auth-disabled runtime semantics are revisited separately

### Why this is the safest bounded first step

- `actor_id` already exists in schema
- runtime interceptor writes already populate it for the intended audit stream
- no richer reviewer role model exists in the repo today
- the frontend audit page is only a placeholder list-count page and does not require broad cross-operator review semantics
- this avoids inventing supervisor/admin/module policies before the repo can express them cleanly

## Answers To The Key Questions

### 1. Is actor-owned audit visibility safe to implement now?

Yes, with one important condition:

- it is safe as the first active-auth read rule for list and detail
- it is not universally complete for every existing audit row because public audit mutation routes can create metadata-less records today

So the safe decision is:

- yes for immediate read scoping
- hide metadata-less rows from normal operator reads
- treat broad audit mutation routes as a separate hardening follow-up

### 2. Does the current schema reliably store `actor_id`?

Partially, not universally.

Reliable today for:

- interceptor-generated runtime audit events when metadata persistence is active

Not reliable today for:

- events created or updated through public audit mutation routes, because those paths currently save only `audit_events` rows without metadata

### 3. Can audit detail be scoped without schema changes?

Yes.

The schema already supports it through `audit_event_metadata.actor_id`, but the implementation will need a metadata-aware lookup path. The current broad `getById()` behavior is not sufficient because it does not join metadata and falls back to placeholder data.

### 4. Should `POST /api/audit` and `PATCH /api/audit/:id` remain available to operator-level users?

No.

They are the weakest fit for the finalized model because:

- audit history should primarily be system-generated
- these routes can create or mutate audit rows without actor metadata
- they undermine actor-based visibility consistency
- the frontend does not depend on them today

Recommended direction:

- do not treat them as normal operator features long-term
- restrict or remove them in a separate hardening slice

### 5. Should audit history be operator-visible at all?

Yes, but only in a bounded self-history form for the first production-facing model.

Removing operator visibility entirely would be a larger product change than the repo currently supports, while keeping broad visibility is unnecessarily risky.

### 6. Does the frontend audit page assume broad audit visibility?

No strong broad-scope assumption is present.

Current page behavior:

- fetch audit list with `{ page: 1, pageSize: 20 }`
- render only `Audit events: {count}`
- no detail page
- no cross-operator comparison UI
- no mutation UI

### 7. Should list/detail use not found for out-of-scope records?

Yes.

That matches the safer pattern already used in:

- AI history detail scoping
- task detail scoping
- alert detail scoping

### 8. Should local-safe remain broad?

Yes.

That is consistent with the repo's established pattern for:

- AI history
- tasks
- alerts

## Rules That Can Be Implemented Now

- actor-based scoping for `GET /api/audit` in Keycloak mode
- the same actor-based rule for `GET /api/audit/:id`
- not-found masking for out-of-scope detail
- broad local-safe behavior preserved

## Rules That Require Schema Support

No immediate schema change is required for the first actor-based rule.

Potential future schema-dependent work may still appear if AquaPulse later wants:

- durable classification for reviewer-only or compliance-only audit classes
- explicit access-policy tags per audit event
- immutable retention/export workflows

## Rules That Should Be Deferred

- owner/admin all-audit visibility
- supervisor limited cross-operator visibility
- module-level reviewer visibility
- compliance export access
- self-auditing of audit access
- removal or redesign of audit mutation routes if product still needs any manual audit-entry workflow

These are deferred because the repo does not currently have:

- a settled reviewer/admin audit-read role model
- a policy layer
- frontend review experiences that depend on them

## First Safe Implementation Slice

1. Scope `GET /api/audit` to the authenticated operator's `actor_id` in Keycloak mode.
2. Scope `GET /api/audit/:id` to the same `actor_id` rule.
3. Return not found for out-of-scope detail.
4. Keep local mode broad.
5. Leave API contracts, frontend UI, persistence schema, and interceptor behavior unchanged.

Implementation note for that future slice:

- do not use the current broad `getById()` alone for scoped detail
- use a metadata-aware repository query or a list-style scoped lookup first

## Recommended Next Branch And Commit

- Branch: `analysis/p1-audit-history-scope-finalization`
- Commit: `chore(analysis): finalize audit history read-scope model before enforcement`
