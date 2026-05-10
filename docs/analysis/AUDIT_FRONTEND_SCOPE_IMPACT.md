# Audit Frontend Scope Impact

## Current Frontend Assumptions

Reviewed files:

- `apps/web/app/(protected)/audit/page.tsx`
- `apps/web/src/queries/index.ts`
- `apps/web/src/repositories/index.ts`
- `apps/web/src/mocks/adapters.ts`

Current frontend audit behavior is intentionally minimal:

- the protected audit page loads `getAuditPageData()`
- `getAuditPageData()` calls `auditRepository.list({ page: 1, pageSize: 20 })`
- the page renders only `Audit events: {audit.items.length}`

There is currently:

- no frontend audit detail page
- no frontend audit create flow
- no frontend audit update flow
- no reviewer/admin audit console
- no UI that assumes cross-operator audit comparison

## Impact Of The Final Recommended Model

If active-auth audit reads become actor-scoped:

- the page count may decrease in Keycloak mode
- no API contract change is required
- no frontend code change is required for the first enforcement slice

## Local-Safe Impact

None expected if local-safe remains broad.

That preserves current:

- mock/demo behavior
- placeholder page readability
- simple development flows

## Detail-View Impact

None immediately, because there is no current web detail page for audit history.

If a detail page is added later:

- it must use the same actor-based rule as list
- it must tolerate not-found for out-of-scope ids

## Mutation-View Impact

None immediately, because the current web layer does not expose audit create/update flows.

This makes later audit mutation restriction low risk from a frontend perspective.

## Test Impact

Current frontend contract tests mostly cover:

- list envelope stability
- pagination semantics

For the first backend enforcement slice, frontend tests likely do not need behavioral changes unless new scoped HTTP integration tests are added.

## Final Frontend Risk Assessment

Low.

The first audit read-scope implementation can stay backend-only because the current frontend audit page is a placeholder count view with no broad reviewer assumptions.
