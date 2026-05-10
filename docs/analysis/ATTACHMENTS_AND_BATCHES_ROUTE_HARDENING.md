# Attachments And Batches Route Hardening

## Scope

This pass hardens only the backend `attachments` and `batches` HTTP controllers by applying the existing bounded auth metadata already enforced by the shared guards.

Out of scope:

- auth architecture redesign
- Keycloak redesign
- frontend routing changes
- API contract changes
- persistence changes
- websocket changes
- runtime diagnostics changes
- ownership filtering

## Attachments Routes Now Protected

All attachments controller routes now require:

- `@RequireAuthentication()`
- `@RequireRoles("operator")`

Protected handlers:

- `POST /api/attachments`
- `GET /api/attachments`
- `PATCH /api/attachments/:id`
- `GET /api/attachments/:id`

## Batches Routes Now Protected

All batches controller routes now require:

- `@RequireAuthentication()`
- `@RequireRoles("operator")`

Protected handlers:

- `POST /api/batches`
- `GET /api/batches`
- `PATCH /api/batches/:id`
- `GET /api/batches/:id`

## What Changed Technically

Both controllers already had:

- `PlaceholderAuthGuard`
- `PlaceholderRoleGuard`

In Keycloak mode, those guards only enforce protection when route metadata is present. This pass adds that missing metadata and leaves guard behavior unchanged.

## What Was Not Added

This pass intentionally does not add:

- ownership validation
- attachment-specific file access rules
- batch lifecycle role differentiation
- any new role hierarchy

The goal is bounded backend exposure hardening only.

## Remaining Authorization Gaps

Still outside this branch:

- partial alerts hardening gaps
- diagnostics role scoping
- ownership-aware restrictions for attachments, batches, AI, and audit
- any broader auth redesign work

## Test Coverage Added

Focused contract coverage now verifies:

- every attachments route carries auth-required metadata
- every batches route carries auth-required metadata
- attachments routes remain usable in local-safe mode
- batches routes remain usable in local-safe mode
- attachments routes reject unauthenticated access in Keycloak mode
- batches routes reject unauthenticated access in Keycloak mode
- attachments routes reject non-operator authenticated users in Keycloak mode
- batches routes reject non-operator authenticated users in Keycloak mode
