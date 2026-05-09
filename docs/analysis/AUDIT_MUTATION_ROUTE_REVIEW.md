# Audit Mutation Route Review

## Purpose

This document reviews whether the public audit mutation routes should remain available after audit list/detail reads were scoped by actor.

Reviewed surfaces:

- `POST /api/audit`
- `PATCH /api/audit/:id`
- `apps/api/src/modules/audit/audit.controller.ts`
- `apps/api/src/modules/audit/application/audit.application-service.ts`
- `apps/api/src/modules/audit/adapters/postgres-audit.repository.ts`
- `apps/api/src/modules/audit/repositories/in-memory-audit.repository.ts`
- `apps/api/src/common/audit/placeholder-audit.interceptor.ts`
- `apps/api/src/modules/audit/audit-runtime-recorder.service.ts`
- `apps/api/src/common/audit/audit-runtime-recorder.ts`
- `apps/web/app/(protected)/audit/page.tsx`
- `apps/web/src/repositories/index.ts`
- `apps/web/src/contracts/api.ts`
- `apps/web/src/clients/endpoint-runtime.ts`
- `apps/web/src/clients/http-placeholder.ts`
- relevant route/catalog tests

## Current Mutation Behavior

### `POST /api/audit`

Current controller behavior:

- authenticated operator route
- calls `AuditApplicationService.create()`

Current application-service behavior:

- direct pass-through to the repository

Current repository behavior:

- creates a synthetic `AuditEvent`
- sets:
  - `action: "create"`
  - `resourceType: "audit"`
  - `summary: "Audit event created through the audit API."`
- persists via `saveEvent()`

Important integrity note:

- `saveEvent()` delegates to `saveEventWithMetadata(event)` without metadata
- therefore this route does not guarantee `actor_id`
- therefore it does not align reliably with the actor-scoped audit read model

### `PATCH /api/audit/:id`

Current controller behavior:

- authenticated operator route
- calls `AuditApplicationService.update()`

Current application-service behavior:

- direct pass-through to the repository

Current repository behavior:

- creates a synthetic `AuditEvent`
- sets:
  - `action: "update"`
  - `resourceType: "audit"`
  - `resourceId: id`
  - `summary: "Audit event updated through the audit API."`
- persists via `saveEvent()`

Important integrity note:

- just like `POST /api/audit`, this path does not guarantee metadata persistence
- it can modify the audit trail without reliable actor attribution in the metadata table

## Current Interceptor And Runtime Write Model

### Interceptor path

The placeholder audit interceptor:

- audits ordinary controller traffic
- derives `resourceType`, `resourceId`, and action from the request
- writes metadata with:
  - `actorId`
  - `requestId`
  - `correlationId`
  - `requestPath`
  - `httpMethod`
  - `statusCode`

It explicitly skips:

- `/api/audit`

That means:

- using the audit mutation routes does not self-generate the same metadata-backed audit trail
- the public audit mutation routes are outside the normal runtime audit-write seam

### Runtime recorder path

The runtime recorder service registers an active recorder only when the Postgres audit repository is active.

That recorder persists:

- the event
- metadata, when provided

This is the cleanest and most trustworthy audit write path in the repo today.

## Caller Inventory Summary

### Frontend product usage

No frontend product flow currently calls audit mutation routes.

Findings:

- the protected audit page only lists audit events
- the frontend repository exposes only `audit.list`
- the frontend `AuditApiClient` interface exposes only:
  - `list`
  - `getById`

So there is:

- no audit create UI
- no audit update UI
- no user-visible mutation flow for audit history

### Runtime feature usage

No runtime feature was found calling `POST /api/audit` or `PATCH /api/audit/:id`.

Actual audit writes in the runtime are driven by:

- the interceptor
- `persistAuditRuntimeEvent()`
- the runtime recorder service

### Test usage

Current tests depend on audit mutation routes only in limited structural ways:

- route metadata/protection coverage
- endpoint catalog parity
- placeholder handler symmetry

I did not find tests that depend on manual audit mutation as a real product behavior.

## Production Necessity Assessment

### `POST /api/audit`

Production necessity:

- no clear evidence

The route appears to exist as:

- placeholder CRUD symmetry
- endpoint catalog coverage

not as a proven product requirement.

### `PATCH /api/audit/:id`

Production necessity:

- no clear evidence

It is an even weaker fit than create because patching audit history undermines the expected integrity of an audit trail unless there is a very explicit correction workflow, which the repo does not currently model.

## Should Operators Ever Manually Create Or Patch Audit Events?

Based on the repo as it exists today:

- normal operators should not manually create audit events in active Keycloak mode
- normal operators should not manually patch audit events in active Keycloak mode

Reasons:

- no product flow needs it
- metadata alignment is weak
- actor-scoped reads already assume metadata-backed integrity
- mutable operator-facing audit history is a poor default trust model

## Safest Future Model

### Immediate safe model

- keep audit writes through the interceptor/runtime-recorder path
- do not treat public audit mutation routes as ordinary operator capabilities in active Keycloak mode
- preserve local-safe broad behavior for development and demo stability
- keep audit read-scope behavior unchanged

### Best bounded direction without contract removal

Do not remove the routes immediately in the first hardening slice.

Instead:

- keep the endpoints in place for contract stability
- restrict or disable them for normal Keycloak operators
- keep local-safe mode broad if needed for development/testing

This avoids:

- breaking endpoint-catalog tests and placeholder plumbing all at once
- changing shared contracts
- forcing a larger audit-platform redesign

## Answers To The Key Questions

### 1. Are audit mutation routes used by any real product flow?

No evidence found.

### 2. Are audit mutation routes needed for frontend behavior?

No.

The frontend does not expose audit mutation behavior.

### 3. Should normal operators ever create audit events manually?

No, not in active Keycloak mode.

### 4. Should normal operators ever patch audit events?

No, not in active Keycloak mode.

### 5. Can audit mutation routes be safely disabled or restricted without breaking tests?

Yes, if the first hardening slice:

- preserves route existence
- preserves API contracts
- preserves local-safe behavior

The current tests mostly care that the routes exist and are protected, not that operator-driven mutation is a required business workflow.

### 6. Should audit mutation routes remain available only in local-safe mode?

That is the safest immediate product-facing model supported by current repo evidence.

### 7. Should future audit writes happen only through runtime recorder/interceptor?

Yes, by default.

That is the only current path with strong metadata alignment.

### 8. What is the safest first implementation slice?

Restrict or disable `POST /api/audit` and `PATCH /api/audit/:id` for ordinary Keycloak operators while preserving:

- route existence
- local-safe broad behavior
- current read-scope behavior

## Final Recommendation

Final recommended mutation model:

- treat audit mutation as runtime/internal behavior, not ordinary operator behavior
- keep interceptor/runtime-recorder writes as the default audit-write path
- restrict or disable public audit mutation routes in active Keycloak mode
- keep local-safe broad if needed for development/testing
- defer any admin-only correction or internal service-token model until there is a real product requirement
