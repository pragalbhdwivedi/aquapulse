# Audit History Scope Review

## Current Access Behavior

Backend state today:

- audit list and detail routes are operator-protected
- any authenticated operator can read any audit event

Stored metadata today includes:

- `actorId`
- `requestId`
- `correlationId`
- `requestPath`
- `httpMethod`
- `statusCode`

But the API read surface currently returns only the `AuditEvent` contract, not metadata-rich scoped views.

## Data Sensitivity

Audit history is one of the most sensitive authenticated read surfaces in the repo.

It can reveal:

- who touched which resources
- which paths were hit
- which records were involved
- when actions occurred

Sensitivity level: `very high`

## Scope Fields Available Today

Available now in persistence:

- `resourceType`
- `resourceId`
- `actorId` in metadata storage

Available now in API response:

- `resourceType`
- `resourceId`
- `action`
- `summary`

Missing from API contract:

- metadata-backed actor field
- direct role-tier-specific read model

## What Filtering Is Technically Possible

### Without schema change

Possible:

- resource-type filtering
- resource-id filtering
- potentially actor-based filtering inside repository logic

### Without API contract change

Limited:

- backend could internally narrow by actor or resource
- but the current API does not expose enough shape to support a richer audit reviewer experience

## Safest Future Enforcement Model

Recommended model:

- **role-scoped**, not user-owned only

Why:

- audit review is usually broader than “my own actions”
- supervisors/reviewers may need cross-actor visibility
- ordinary operators likely do not need unrestricted audit-history visibility

## Schema Change Requirement

Schema change is **not strictly required** to begin narrowing reads, because `actorId` already exists in `audit_event_metadata`.

However, API and repository behavior change would still be meaningful, and a better reviewer-facing contract may eventually be needed.

## Recommendation

Do **not** start with audit ownership filtering first.

Safer order:

1. scope AI history first
2. decide the role model for audit readers
3. then narrow audit history with an explicit reviewer/supervisor access plan
