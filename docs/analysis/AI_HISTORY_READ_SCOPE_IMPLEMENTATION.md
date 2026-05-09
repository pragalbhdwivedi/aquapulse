# AI History Read-Scope Implementation

## Scope

This pass implements only the first bounded ownership/read-scope seam:

- AI history list reads
- AI history detail reads

Out of scope:

- AI generation endpoints
- AI feedback ownership
- pond-level AI scoping
- reviewer or admin override models
- broader RBAC redesign
- schema changes

## What AI Reads Are Now Scoped

### List reads

`GET /api/ai` history reads are now scoped by the requesting operator when:

- the request resolved a real Keycloak-backed user session
- that session provides a stable requester id

The scope anchor used is:

- `AiRequestRecord.requestedBy`

### Detail reads

`GET /api/ai/:id` history detail reads now use the same owner check.

If the requested response is tied to an AI request from a different requesting operator, the API returns a not-found result instead of revealing cross-operator history.

## What Remains Intentionally Broad

Intentionally unchanged:

- AI generation endpoints
- local-safe development mode
- disabled-auth fallback mode
- AI feedback storage and reads
- pond-linked or record-linked shared visibility logic

## Why Local Mode Stays Broad

Local mode is intentionally preserved as a development-safe path.

Reason:

- existing mock/demo flows use deterministic local sessions
- older seeded AI history entries are not keyed to the local dev user id
- narrowing local history immediately would make demo and verification flows look broken

## Technical Shape

The implementation stays bounded:

- controller extracts requester identity from the already-hydrated session
- application service injects requester scope into list/detail reads
- repository list filtering uses existing `requestedBy` semantics
- no shared contract changes were required

## Test Coverage Added

Focused tests now verify:

- keycloak-scoped list reads only return the requesting operator’s history
- keycloak-scoped detail reads hide another operator’s record
- matching keycloak users can still read their own record
- local-safe reads remain broad
