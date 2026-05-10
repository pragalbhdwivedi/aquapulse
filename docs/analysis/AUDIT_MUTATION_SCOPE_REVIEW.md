# Audit Mutation Scope Review

## Current Surfaces

- `POST /api/audit`
- `PATCH /api/audit/:id`

## Current Access Behavior

Both routes are currently:

- auth-protected
- operator-protected
- available to any authenticated operator in Keycloak mode

The frontend does not currently depend on these mutation routes.

## Current Persistence Behavior

These routes currently call:

- `AuditApplicationService.create()`
- `AuditApplicationService.update()`

Those methods pass straight through to the repository.

In the Postgres audit repository:

- `create()` builds an `AuditEvent` row and calls `saveEvent()`
- `update()` builds an `AuditEvent` row and calls `saveEvent()`
- `saveEvent()` delegates to `saveEventWithMetadata(event)` without providing metadata

Result:

- these operator-facing mutation routes do not reliably persist `actor_id`
- they do not persist request metadata unless some caller explicitly supplies a different path later

## Sensitivity Level

Very high.

Broad operator mutation of audit history is a poor fit for an audit trail because it risks:

- metadata-less records
- ambiguous authorship
- manual mutation of what should usually be system-generated evidence

## Available Scope Field

No safe ownership field is written by these routes today.

That makes them weaker than the interceptor-generated audit path for future read scoping.

## Safest Future Access Model

Recommended long-term position:

- do not treat audit POST/PATCH as ordinary operator features

Recommended bounded direction:

- restrict them further than list/detail
- preferably elevate them to a narrower internal/admin-only path, or remove them if unused

## Can They Stay Broad Under The Finalized Read Model?

Not safely.

Reason:

- the finalized read model depends on `actor_id`
- these routes can create rows without `actor_id`
- broad operator mutation would keep injecting rows that normal operators cannot safely or consistently read back

## Is A Schema Change Required To Restrict Them?

No.

Restriction or removal is a route/auth decision, not a schema requirement.

## Should Restricting These Routes Be In The First Read-Scope Slice?

Not necessarily.

The first safe implementation slice can stay focused on:

- list scoping
- detail scoping
- not-found masking

But the next hardening step after that should address audit mutation routes explicitly.

## Local-Safe Behavior

Local-safe can remain broad in this analysis model.

That does not justify broad production-facing operator access. It only preserves current demo and development behavior until the route policy changes are made deliberately.

## Frontend Impact Risk

Low.

Current web code:

- does not expose an audit create UI
- does not expose an audit update UI
- only reads the audit list

## Test Coverage Needed For Future Mutation Tightening

- audit mutation routes reject normal Keycloak operators if the policy is tightened
- local-safe remains usable if that behavior is intentionally preserved
- audit list/detail behavior remains unchanged when mutation restriction is added
