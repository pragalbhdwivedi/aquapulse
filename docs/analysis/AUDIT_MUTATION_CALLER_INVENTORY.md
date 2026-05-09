# Audit Mutation Caller Inventory

## Backend Runtime Callers

### Found

- `PlaceholderAuditInterceptor` writes audit events through `persistAuditRuntimeEvent()`
- `AuditRuntimeRecorderService` connects runtime events to `saveEventWithMetadata()`

These are real runtime audit-write paths.

### Not found

No runtime feature was found calling:

- `POST /api/audit`
- `PATCH /api/audit/:id`
- `AuditApplicationService.create()` as a business flow
- `AuditApplicationService.update()` as a business flow

## Frontend Callers

### Found

- audit page uses `auditRepository.list()`

### Not found

No frontend product code was found calling:

- `clients.audit.create`
- `clients.audit.update`
- `repositories.audit.create`
- `repositories.audit.update`

Current frontend audit abstractions expose only:

- `list`
- `getById`

## Shared Client Plumbing

The following plumbing still references audit create/update endpoints:

- endpoint catalog
- invocation registry
- placeholder HTTP transport registry
- endpoint runtime handlers

This means the routes still exist in the platform surface, but not that the product currently needs them.

## Test Callers

### Found

Tests depend on audit mutation routes structurally through:

- route protection metadata inventory
- endpoint catalog parity
- placeholder handler composition

### Not found

No test was found that relies on:

- real operator-driven audit create workflow
- real operator-driven audit patch workflow
- frontend mutation behavior for audit history

## Inventory Conclusion

The repo currently shows:

- real runtime need for interceptor/runtime-recorder audit writes
- no demonstrated product need for public audit mutation routes
- only structural/test-platform evidence that the routes exist
