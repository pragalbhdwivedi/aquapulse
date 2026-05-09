# AI And Audit Route Hardening

## Scope

This pass hardens only the backend `ai` and `audit` HTTP controllers by applying the already-existing bounded auth metadata that the current guards enforce.

Out of scope:

- auth architecture redesign
- Keycloak redesign
- frontend routing changes
- API contract changes
- websocket changes
- persistence changes
- runtime diagnostics changes

## Routes Now Protected

### AI routes

All AI controller routes now require:

- `@RequireAuthentication()`
- `@RequireRoles("operator")`

Protected handlers:

- `POST /api/ai`
- `GET /api/ai`
- `PATCH /api/ai/:id`
- `GET /api/ai/:id`
- `POST /api/ai/alerts/explain`
- `POST /api/ai/alerts/explain/feedback`
- `POST /api/ai/ponds/summarize`
- `POST /api/ai/handover/generate`
- `POST /api/ai/text/rewrite`
- `POST /api/ai/dashboard/query`
- `POST /api/ai/incidents/draft`
- `POST /api/ai/approvals/draft-note`

### Audit routes

All audit controller routes now require:

- `@RequireAuthentication()`
- `@RequireRoles("operator")`

Protected handlers:

- `POST /api/audit`
- `GET /api/audit`
- `PATCH /api/audit/:id`
- `GET /api/audit/:id`

## What Changed Technically

The guards were already installed at the controller level:

- `PlaceholderAuthGuard`
- `PlaceholderRoleGuard`

The missing piece was route metadata. In Keycloak mode, routes without auth or role metadata remained public. This pass closes that gap without changing guard logic.

## Ownership Validation

No new ownership validation was added in this pass.

Reason:

- the existing AI and audit list/detail flows do not currently express record ownership semantics
- adding ownership filtering here would change behavior and increase risk
- the current goal is bounded route hardening, not authorization redesign

## Remaining Authorization Gaps

Still out of scope after this pass:

- ownership checks for AI history records
- ownership checks for audit history records
- role differentiation beyond the existing bounded `operator` role model
- attachments and batches route hardening
- partial alert route hardening
- diagnostics role scoping

## Test Coverage Added

Focused contract coverage now verifies:

- every AI route carries auth-required metadata
- every audit route carries auth-required metadata
- AI routes remain usable in local-safe mode
- audit routes remain usable in local-safe mode
- AI routes reject unauthenticated access in Keycloak mode
- audit routes reject unauthenticated access in Keycloak mode
- AI routes reject non-operator authenticated users in Keycloak mode
- audit routes reject non-operator authenticated users in Keycloak mode
