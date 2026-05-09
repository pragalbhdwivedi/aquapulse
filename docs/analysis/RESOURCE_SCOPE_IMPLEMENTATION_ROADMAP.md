# Resource Scope Implementation Roadmap

## Recommended order

1. Design and add pond responsibility schema/model.
2. Add internal pond authorization service contracts.
3. Enforce pond read-scope in active authenticated mode.
4. Enforce batch read-scope by pond responsibility.
5. Add parent-resource scope resolver with first-wave supported types:
   - alerts
   - tasks
   - audit
   - ai
6. Enforce attachment parent-resource read-scope for first-wave supported types.
7. Add water-quality and feed pond-scoped read rules.
8. Expand attachment parent-resource support to pond-linked parent types.
9. Add attachment file-content/download authorization using the same parent decision.
10. Design saved-view ownership.
11. Design and add supervisor/admin override rules.

## Why this order is safe

- pond responsibility is the missing shared dependency for several modules
- batches become enforceable quickly once pond responsibility exists
- attachments should not go first because they depend on parent authorization readiness
- file-content access should come after attachment metadata/detail scope, not before

## Resource types supported first

For a future parent-resource resolver, the first supportable parent types are:

- `alert`
- `task`
- `audit`
- `ai`

## Resource types denied or deferred first

Until pond responsibility exists, these should stay denied or deferred in active auth:

- `pond`
- `batch`
- `water-quality`
- `feed`
- unknown parent types

## Local-safe recommendation

Keep local-safe broad across the rollout.

This avoids breaking demos, mocks, and development ergonomics while production-scoped enforcement grows incrementally.

## Endpoint convention recommendation

- list and detail must always be scoped together
- out-of-scope detail should return not found
- route-level mutation blocks may continue using forbidden when the route itself is intentionally unavailable

## First safe implementation slice after design

The first safe implementation slice after this design work is:

1. add pond responsibility persistence/model
2. add `canReadPond(...)`
3. scope batch list/detail by pond responsibility in active Keycloak mode

This has lower ambiguity than attachments and unlocks the pond-linked foundation other modules need.
