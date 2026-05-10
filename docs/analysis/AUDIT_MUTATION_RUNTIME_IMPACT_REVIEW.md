# Audit Mutation Runtime Impact Review

## Current Runtime Reality

The current reliable audit-write model is:

1. controller request passes through the placeholder audit interceptor
2. interceptor builds an `AuditEvent`
3. interceptor captures request metadata
4. runtime recorder persists event plus metadata when available

The public audit mutation routes are outside that normal path because:

- the interceptor skips `/api/audit`
- the repository `create/update` methods write only synthetic `AuditEvent` rows through `saveEvent()`
- metadata is not guaranteed on those writes

## Impact Of Keeping Public Mutation Routes Broad

If broad operator access remains:

- operators can continue creating audit rows that may not be visible under actor-scoped reads
- operators can patch audit rows without a modeled correction workflow
- the audit trail keeps mixing high-integrity runtime writes with lower-integrity manual writes

That weakens the platform trust story more than it helps any proven product flow.

## Impact Of Restricting Them In Active Keycloak Mode

Likely runtime impact:

- low for product behavior
- low for frontend behavior
- low for runtime write flows

Reason:

- real runtime writes do not depend on these routes
- frontend does not call these routes
- current tests mostly verify route existence and auth metadata rather than a business mutation workflow

## Local-Safe Consideration

Keeping local-safe broad would preserve:

- development convenience
- demo stability
- placeholder flexibility

while still allowing active Keycloak mode to move to a safer production-facing policy.

## Read-Scope Compatibility

Restricting public mutation routes later would not need to change the current actor-scoped read model.

In fact, it improves consistency because:

- runtime-generated rows are the rows most likely to have reliable `actor_id`
- the read model already assumes metadata-backed trust

## Safe First Hardening Slice

The safest bounded implementation slice would be:

- leave route contracts intact
- leave local-safe broad
- restrict or disable public audit POST/PATCH for ordinary Keycloak operators
- keep interceptor/runtime-recorder writes untouched
