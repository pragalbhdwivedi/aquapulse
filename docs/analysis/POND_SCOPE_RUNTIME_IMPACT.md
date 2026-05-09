# Pond Scope Runtime Impact

## Runtime impact

This pass changes only pond read behavior in active authenticated mode.

Affected backend seams:

- pond controller read path
- pond application-service read path
- pond repository list filtering

Unaffected seams:

- pond create/update
- batches
- attachments
- feed
- water-quality
- task, alert, AI, and audit scope behavior
- frontend response shapes

## Local-safe compatibility

Local-safe is preserved intentionally:

- list remains broad because `listReadablePondIds(...)` returns `undefined`
- detail remains broad because `canReadPond(...)` allows local actors

## Frontend impact

Frontend runtime remains stable because:

- the contract shape is unchanged
- pond pages already use the same list/detail endpoints
- local-safe mock and development flows stay broad

In active Keycloak mode, page datasets may now shrink to only the actor's responsible ponds.

## Blast radius

Blast radius is limited because:

- only `ponds.list` and `ponds.getById` changed
- no pond-linked child modules consume the new bounded list yet
- no mutation route behavior changed

## Remaining pond visibility gaps

- no pond mutation scoping
- no pond-manager expansion beyond direct responsibility rows
- no supervisor/admin override visibility
- no pond-linked batch/feed/water-quality scoping yet
- no attachment parent-resource inheritance yet

## Next safe seam

The next safe scope seam is batch read-scope by `pondId`, using the same pond responsibility foundation.
