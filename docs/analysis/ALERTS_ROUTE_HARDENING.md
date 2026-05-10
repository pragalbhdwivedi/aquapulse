# Alerts Route Hardening

## Scope

This pass hardens only the remaining partial backend authorization gaps in the alerts HTTP controller.

Out of scope:

- alerts live-updates websocket behavior
- alerts persistence changes
- alert explanation AI behavior
- frontend alerts behavior
- runtime diagnostics
- shared contracts
- ownership filtering

## Alerts Routes Already Protected Before This Pass

These handlers already required:

- `@RequireAuthentication()`
- `@RequireRoles("operator")`

Already protected handlers:

- `GET /api/alerts`
- `GET /api/alerts/summary`
- `POST /api/alerts/views`
- `POST /api/alerts/views/:id/remove`
- `POST /api/alerts/bulk/acknowledge`
- `POST /api/alerts/bulk/resolve`
- `POST /api/alerts/bulk/assign`
- `POST /api/alerts/bulk/review-state`
- `POST /api/alerts/:id/acknowledge`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/assign`
- `POST /api/alerts/:id/unassign`
- `POST /api/alerts/:id/review-state`
- `GET /api/alerts/:id`

## Alerts Routes Newly Protected In This Pass

The remaining partial handlers now also require:

- `@RequireAuthentication()`
- `@RequireRoles("operator")`

Newly protected handlers:

- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `POST /api/alerts/:id/attach-explanation`
- `GET /api/alerts/views`

## Alerts Surfaces Intentionally Untouched

Left unchanged on purpose:

- `GET /api/alerts/live-updates/session`
- alerts websocket/live-updates service behavior
- alert lifecycle semantics
- alert ownership semantics

## What Changed Technically

The alerts controller already used:

- `PlaceholderAuthGuard`
- `PlaceholderRoleGuard`

The remaining gap was missing route metadata on a small set of handlers. This pass adds that metadata and leaves the guards plus live-updates logic unchanged.

## Test Coverage Added

Focused contract coverage now verifies:

- previously protected alerts handlers still carry operator auth metadata
- the newly hardened alerts handlers now carry operator auth metadata
- the live-updates session route remains undecorated
- newly hardened alerts handlers remain usable in local-safe mode
- newly hardened alerts handlers reject unauthenticated access in Keycloak mode
- newly hardened alerts handlers reject non-operator authenticated users in Keycloak mode
