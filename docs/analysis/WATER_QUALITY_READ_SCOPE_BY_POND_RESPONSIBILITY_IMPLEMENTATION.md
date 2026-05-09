# Water-Quality Read Scope By Pond Responsibility Implementation

## Scope

This pass implements only the bounded water-quality read seam:

- `GET /api/water-quality`
- `GET /api/water-quality/:id`

It reuses the existing pond responsibility foundation and does not change any other module behavior.

## Implemented behavior

In active authenticated Keycloak mode:

- water-quality list reads are narrowed to readings whose `pondId` is readable by the current actor
- water-quality detail reads reuse pond responsibility checks through `canReadPond(...)`
- out-of-scope detail reads return not found
- actors with no active pond responsibilities receive an empty list

In local-safe mode:

- water-quality list remains broad
- water-quality detail remains broad

## Implementation seam

The water-quality read path now follows the same bounded pond-linked pattern as pond and batch reads:

1. controller resolves a small requester scope from the current session
2. application service resolves readable pond IDs through the pond responsibility service
3. list reads carry internal `readablePondIds` filtering into the repository
4. detail reads verify `canReadPond(...)` before returning a direct-ID record

## What did not change

- water-quality create behavior
- water-quality update behavior
- pond endpoints
- batch endpoints
- feed or attachment reads
- parent-resource resolver
- task, alert, AI, or audit scope behavior
- frontend contracts or rendering behavior

## Frontend impact

Frontend contract shapes are unchanged.

The only user-visible effect in active Keycloak mode is that water-quality datasets can narrow to ponds the actor is responsible for. Local-safe and mock flows remain broad.
