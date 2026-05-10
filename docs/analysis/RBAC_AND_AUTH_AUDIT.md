# RBAC And Auth Audit

## Auth Strategy In Use
- Modes:
  - `disabled`
  - `local`
  - `keycloak`
- Runtime auth service: real implementation in `ApiAuthService`
- Current-session summarization: implemented in `CurrentSessionService`
- Guards:
  - `PlaceholderAuthGuard`
  - `PlaceholderRoleGuard`

## Keycloak Integration State

### Implemented
- Bearer extraction
- JWT decode
- Issuer/audience/client checks
- JWKS-backed signature verification
- RS256 enforcement
- Cached verification state
- Runtime diagnostics for keycloak configuration and verification

### Bounded / Incremental
- Auth rollout is slice-based, not universal
- Web-to-API auth forwarding is explicit and local-bridge aware
- Web current-session can fall back safely when backend auth state is unavailable

## RBAC State

### What Exists
- Role-based decorators exist:
  - `@RequireAuthentication()`
  - `@RequireRoles(...)`
- Role checks are enforced through `ApiAuthService`
- There is a bounded operator-access model, especially for:
  - alerts operator actions
  - non-alert update/create actions
  - selected protected reads

### What Does Not Exist
- No full repo-wide RBAC policy engine
- No generalized permission graph
- No domain-wide policy registry
- No evidence of production-grade admin/manager/viewer authorization across every module

## Current Protected Slice State

### Alerts
- Protected reads:
  - alerts list
  - alert detail
  - alert summary
- Protected mutations:
  - lifecycle
  - triage
  - bulk actions
  - saved view mutations

### Non-Alert Protected Reads
- `water_quality_detail_read`
- `feed_detail_read`
- `ponds_detail_read`
- `tasks_detail_read`
- `water_quality_recent_read`
- `feed_recent_read`

### Non-Alert Protected Mutations
- `tasks_update`
- `tasks_create`
- `feed_update`
- `feed_create`
- `ponds_update`
- `ponds_create`
- `water_quality_create`
- `water_quality_update`

## Gaps
- Ponds list and tasks list remain less protected than detail/update flows by design
- Supporting modules are not clearly aligned with the bounded auth model:
  - attachments
  - batches
  - audit
  - AI history CRUD endpoints
- The guard names still say `Placeholder*`, which is accurate to the rollout posture but confusing for production perception

## Dangerous To Modify
- `apps/api/src/common/auth/api-auth.service.ts`
- `apps/api/src/common/auth/current-session.service.ts`
- `apps/web/src/features/auth-session-server.ts`
- `apps/web/src/clients/runtime-config.ts`
- alerts live-updates auth flow

Reason:
- These files define the bounded security model and its frontend/backend alignment.

## Production Safety
- Keycloak verification path: real
- Bounded protected-slice model: real
- Full RBAC platform: not implemented

## Summary
Auth is one of the stronger systems in the repo, but it is intentionally bounded and additive. This is not a finished enterprise RBAC layer, and it should not be treated like one yet.
