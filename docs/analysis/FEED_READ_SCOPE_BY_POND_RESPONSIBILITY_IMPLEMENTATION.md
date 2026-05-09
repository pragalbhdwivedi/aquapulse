# Feed Read Scope By Pond Responsibility Implementation

## Scope

This pass implements only the bounded feed read seam:

- `GET /api/feed`
- `GET /api/feed/:id`

It reuses the existing pond responsibility foundation and does not change any other module behavior.

## Implemented behavior

In active authenticated Keycloak mode:

- feed list reads are narrowed to entries whose `pondId` is readable by the current actor
- feed detail reads reuse pond responsibility checks through `canReadPond(...)`
- out-of-scope detail reads return not found
- actors with no active pond responsibilities receive an empty list

In local-safe mode:

- feed list remains broad
- feed detail remains broad

## Implementation seam

The feed read path now follows the same bounded pond-linked pattern as pond, batch, and water-quality reads:

1. controller resolves a small requester scope from the current session
2. application service resolves readable pond IDs through the pond responsibility service
3. list reads carry internal `readablePondIds` filtering into the repository
4. detail reads verify `canReadPond(...)` before returning a direct-ID record

## What did not change

- feed create behavior
- feed update behavior
- pond endpoints
- batch endpoints
- water-quality endpoints
- attachment reads
- parent-resource resolver
- task, alert, AI, or audit scope behavior
- frontend contracts or rendering behavior

## Frontend impact

Frontend contract shapes are unchanged.

The only user-visible effect in active Keycloak mode is that feed datasets can narrow to ponds the actor is responsible for. Local-safe and mock flows remain broad.
