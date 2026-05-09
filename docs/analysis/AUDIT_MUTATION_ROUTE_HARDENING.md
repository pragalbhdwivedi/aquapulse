# Audit Mutation Route Hardening

## Summary

This pass hardens only the public audit mutation routes:

- `POST /api/audit`
- `PATCH /api/audit/:id`

In active authenticated Keycloak mode:

- ordinary operators can no longer manually create audit events
- ordinary operators can no longer manually patch audit events

In local-safe and other non-enforcing modes:

- existing broad mutation behavior remains available for development and testing

Out of scope:

- audit read behavior
- interceptor behavior
- runtime recorder behavior
- schema changes
- frontend changes
- RBAC redesign

## What Changed

### Controller mutation path

`AuditController.create()` and `AuditController.update()` now pass the existing bounded requester identity into the application service.

### Application-service mutation path

`AuditApplicationService.create()` and `AuditApplicationService.update()` now:

- reject Keycloak-scoped operator mutation attempts
- use the existing forbidden-error convention
- keep local-safe mutation behavior broad

## What Stayed Unchanged

- `GET /api/audit` actor-scoped read behavior
- `GET /api/audit/:id` actor-scoped detail behavior
- audit interceptor skip logic for `/api/audit`
- runtime recorder registration and persistence behavior
- repository write semantics
- API route existence
- frontend behavior

## Why This Is Safe

- public audit mutation routes were not used by frontend product flows
- runtime audit writes continue to use the interceptor/runtime-recorder seam
- local-safe development compatibility remains intact
- the hardening is limited to active Keycloak-mode operator mutation attempts

## Result

Trusted audit writes remain:

- interceptor-generated
- runtime-recorder persisted
- metadata-backed when available

Public operator-driven audit mutation in active auth is now blocked.
