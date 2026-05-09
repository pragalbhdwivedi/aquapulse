# Batch Read Scope By Pond Responsibility Implementation

## Scope

This pass implements only the first bounded batch read seam:

- `GET /api/batches`
- `GET /api/batches/:id`

It uses the existing pond responsibility foundation and does not change any other module behavior.

## Implemented behavior

In active authenticated Keycloak mode:

- batch list reads are narrowed to batches whose `pondId` is readable by the current actor
- batch detail reads reuse the same pond-bounded rule through a scoped detail lookup
- out-of-scope detail reads return not found
- actors with no active pond responsibilities receive an empty batch list

In local-safe mode:

- batch list remains broad
- batch detail remains broad

## Implementation seam

The batch read path now follows the same bounded pattern as pond reads:

1. controller resolves a small requester scope from the current session
2. application service resolves readable pond IDs through the pond responsibility service
3. list reads carry internal `readablePondIds` filtering into the repository
4. detail reads use the same bounded lookup so direct IDs cannot bypass scope

## What did not change

- batch create behavior
- batch update behavior
- pond endpoints
- attachment, feed, or water-quality reads
- parent-resource resolver
- task, alert, AI, or audit scope behavior
- frontend contracts or rendering behavior

## Frontend impact

Frontend contract shapes are unchanged.

The only user-visible effect in active Keycloak mode is that batch list/detail responses can narrow to ponds the actor is responsible for. Local-safe and mock flows remain broad.
