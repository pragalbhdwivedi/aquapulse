# Batch Pond Scope Review

## Current state

Batches are the clearer of the two surfaces because they already expose `pondId` directly.

The repository supports:

- broad `getById(id)`
- list filtering by `pondId`

The controller and application service do not use authenticated operator identity in those reads.

## Why pond scope is the right future model

Batch operational data is pond-linked by design. Cross-pond batch visibility can reveal:

- stocking levels
- lifecycle stage
- species mix
- operational structure across ponds

So the natural future scope anchor is `pondId`, not ad hoc user ownership.

## Why enforcement is still unsafe today

The repo does not currently define:

- which operator is responsible for which pond
- whether operators should see one pond, several ponds, or all ponds in authenticated production mode
- whether any manager/supervisor cross-pond override exists

Without that mapping, a pond-scoped enforcement rule would be a product guess.

## List/detail coupling

Batch list and batch detail must be scoped together.

It would be unsafe to:

- filter the list by pond but leave `GET /api/batches/:id` broad
- return detail records for direct IDs that would not appear in the list

## Local-safe

Local-safe should remain broad.

That preserves the current demo and development experience while the production pond-responsibility model is still undefined.

## Decision

Batch read-scope enforcement should wait until the product defines and the runtime can resolve pond responsibility for authenticated operators.
