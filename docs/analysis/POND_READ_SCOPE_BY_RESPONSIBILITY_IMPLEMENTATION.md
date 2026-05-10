# Pond Read Scope By Responsibility Implementation

## Scope

This pass implements only the first pond read boundary:

- `GET /api/ponds`
- `GET /api/ponds/:id`

It uses the previously added pond responsibility foundation and does not change any other module read behavior.

## Implemented behavior

In active authenticated Keycloak mode:

- pond list reads are narrowed to the actor's active pond responsibilities
- pond detail reads require `canReadPond(actor, pondId)`
- out-of-scope detail reads return not found
- actors with no active pond responsibilities receive an empty list

In local-safe mode:

- pond list remains broad
- pond detail remains broad

## Implementation seam

The read path now follows the same bounded pattern used by other scoped modules:

1. controller resolves a small requester scope from the current session
2. application service asks the pond responsibility service for allowed pond visibility
3. list reads carry internal `readablePondIds` filtering into the repository
4. detail reads use `canReadPond(...)` and collapse out-of-scope reads to not found

## What did not change

- pond create behavior
- pond update behavior
- batch, attachment, feed, or water-quality reads
- parent-resource scope resolver
- task, alert, AI, or audit read-scope behavior
- frontend contracts or rendering behavior

## Frontend impact

Frontend contract shapes are unchanged.

The only user-visible effect in active Keycloak mode is that pond list/detail responses can now narrow to the actor's responsible ponds. Local-safe and mock flows remain broad.
