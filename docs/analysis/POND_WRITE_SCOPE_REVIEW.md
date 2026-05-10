# Pond Write Scope Review

## Surfaces

- `POST /api/ponds`
- `PATCH /api/ponds/:id`

## Current behavior

- both routes are authenticated and operator-role protected
- neither route has record-scope or role-tier mutation logic
- application service directly calls repository `create(...)` and `update(...)`

## Sensitivity

High. Pond writes alter the root entity that downstream pond-linked reads and writes inherit from.

## Available scope field

No pond-responsibility target exists for create.

Update targets a pond directly by route id, but the current pond-responsibility seam answers read visibility, not pond-admin authority.

## Enforcement readiness

Not safe now.

Reason:

- pond responsibility is a read foundation, not yet a pond-mutation authority model
- ordinary operator pond creation/update likely should not be the long-term model
- safe enforcement likely needs an owner/admin/supervisor or pond-manager mutation rule

## Recommendation

- keep current runtime unchanged for now
- defer pond write enforcement until a mutation-capable role model exists

## Frontend impact risk

High if changed prematurely. Pond create and update are directly exposed in the web app.

