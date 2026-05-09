# Feed Scope Runtime Impact

## Runtime impact

This pass changes only feed read behavior in active authenticated mode.

Affected backend seams:

- feed controller read path
- feed application-service read path
- feed repository list filtering

Unaffected seams:

- feed create/update
- ponds
- batches
- water-quality
- attachments
- task, alert, AI, and audit scope behavior
- frontend response shapes

## Local-safe compatibility

Local-safe is preserved intentionally:

- list remains broad because `listReadablePondIds(...)` returns `undefined`
- detail remains broad because local actors still pass `canReadPond(...)`

## Frontend impact

Frontend runtime remains stable because:

- the contract shape is unchanged
- existing feed consumers still call the same list/detail endpoints
- local-safe mock and development flows stay broad

In active Keycloak mode, visible feed datasets may now shrink to ponds the actor is responsible for.

## Blast radius

Blast radius is limited because:

- only feed list and detail changed
- no pond-linked child-resource authorization beyond feed was added
- no mutation route behavior changed

## Remaining feed visibility gaps

- no feed mutation scoping
- no pond-manager or supervisor/admin override expansion
- no attachment parent-resource inheritance
- no parent-resource resolver

## Next safe seam

The next safe scoping seam is attachment parent-resource scoping once the resolver work begins.
