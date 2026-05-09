# RBAC Runtime Audit

## Executive Summary

AquaPulse has a real but intentionally bounded authorization model.

What is real today:

- runtime auth mode switching: `disabled`, `local`, `keycloak`
- bearer-token verification against Keycloak JWKS
- backend guard enforcement through `PlaceholderAuthGuard` and `PlaceholderRoleGuard`
- bounded operator-only enforcement on selected alert and non-alert slices
- alerts websocket subscription enforcement in Keycloak mode

What is not real today:

- repo-wide RBAC
- admin-only role model
- ownership-based authorization
- domain-by-domain backend protection parity
- uniform backend protection for AI, audit, attachments, and batches

## Current RBAC Model

The effective runtime model is:

- `disabled`: backend auth bypass
- `local`: backend resolves a local operator-shaped user
- `keycloak`: backend requires a verified bearer token for routes explicitly marked with auth metadata

Role handling is extremely small in scope:

- only `operator` is meaningfully enforced
- `alerts:operate` is treated as equivalent operator access for alerts/websocket checks
- no admin role is actually used in route protection
- no ownership or per-resource authorization exists

## Module Status

### Fully Protected

- `feed`
  - list, detail, create, update all require authenticated operator access
- `water-quality`
  - list, detail, create, update all require authenticated operator access
- alerts live updates websocket subscription path
  - Keycloak mode requires verified auth plus operator access

### Partially Protected

- `alerts`
  - protected:
    - list
    - summary
    - detail
    - saved-view mutations
    - lifecycle actions
    - triage actions
    - bulk actions
  - unprotected:
    - `POST /api/alerts`
    - `PATCH /api/alerts/:id`
    - `POST /api/alerts/:id/attach-explanation`
    - `GET /api/alerts/views`
- `ponds`
  - protected:
    - detail
    - create
    - update
  - public:
    - list
- `tasks`
  - protected:
    - detail
    - create
    - update
  - public:
    - list

### Missing Backend Enforcement

- `ai`
  - all routes are backend-accessible without `RequireAuthentication` / `RequireRoles`
- `audit`
  - list/detail/create/update are backend-accessible without auth metadata
- `attachments`
  - all routes are backend-accessible without auth metadata
- `batches`
  - all routes are backend-accessible without auth metadata

### UI-Guarded But Not Route-Gated

- protected web layout
- reports page AI actions/history/reuse/compare flow
- runtime page
- audit page
- action forms in alerts/ponds/tasks/feed pages

These surfaces often disable controls or explain auth state, but they do not create a hard frontend route boundary and cannot substitute for backend enforcement.

## Keycloak Integration State

Keycloak integration is real but bounded:

- issuer/client/audience validation exists
- JWKS verification exists
- roles are extracted from:
  - `realm_access.roles`
  - `resource_access[clientId].roles`
- permissions are extracted from:
  - `scope`
  - `permissions`

Missing or intentionally deferred:

- refresh/session lifecycle management
- token introspection
- fine-grained permission model
- per-domain role taxonomy

## Ownership And Admin Gaps

No major domain currently enforces:

- “only the assignee can edit”
- “only the creator can update”
- “only admins can read audit history”
- “only supervisors can access AI history”

This means operator-level enforcement, where present, is broad rather than resource-scoped.

## Safe Interpretation

The runtime authorization model is good enough for bounded staged work, but not yet good enough to be described as full RBAC hardening.

The next safe step is not a redesign. It is a bounded backend hardening pass over one sensitive public seam at a time.
