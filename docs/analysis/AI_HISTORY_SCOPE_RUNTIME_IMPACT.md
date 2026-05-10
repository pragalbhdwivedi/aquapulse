# AI History Scope Runtime Impact

## Summary

This pass narrows AI history visibility for authenticated Keycloak operators using the existing `requestedBy` persistence field.

It does not change:

- AI generation behavior
- advisory-only semantics
- frontend route structure
- runtime diagnostics
- schemas

## Runtime Impact

### Keycloak mode

Behavior changes in Keycloak mode:

- AI history list reads are narrowed to the requester’s own records
- AI history detail reads are hidden when the underlying request belongs to a different requester

### Local mode

Behavior is intentionally preserved:

- local-safe development keeps broad AI history visibility
- this avoids breaking current demo and mock verification flows

### Disabled mode

Behavior is unchanged:

- disabled mode remains non-enforcing and broad

## Frontend Impact

No contract shape changed.

Expected UI behavior:

- reports and AI history review screens keep working
- in Keycloak mode, users will simply see a narrower history set
- in local-safe mode, current seeded history remains visible

## Blast Radius

Low and bounded.

Touched surfaces:

- AI controller list/detail read path
- AI application-service history filtering
- AI repository response-list filtering
- focused tests
- analysis docs

Untouched surfaces:

- AI generation services
- shared contracts
- validation schemas
- auth internals
- websocket/live-updates seams
- persistence schema
- frontend routing

## Remaining Ownership Gaps

- AI feedback is still broad
- local mode remains intentionally broad
- no pond-level or linked-record scope exists yet
- no supervisor/reviewer override exists yet

## Safe Next Ownership Seam

After this pass, the safest next scope seam is:

- tasks list scoping by `assigneeId` and optional `pondId`

That seam has natural scope fields already present and avoids the higher-risk audit and saved-view semantics.
