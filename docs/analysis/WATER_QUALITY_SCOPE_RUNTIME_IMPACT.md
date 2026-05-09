# Water-Quality Scope Runtime Impact

## Runtime impact

This pass changes only water-quality read behavior in active authenticated mode.

Affected backend seams:

- water-quality controller read path
- water-quality application-service read path
- water-quality repository list filtering

Unaffected seams:

- water-quality create/update
- ponds
- batches
- feed
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
- existing water-quality consumers still call the same list/detail endpoints
- local-safe mock and development flows stay broad

In active Keycloak mode, visible water-quality datasets may now shrink to ponds the actor is responsible for.

## Blast radius

Blast radius is limited because:

- only water-quality list and detail changed
- no pond-linked child-resource authorization beyond water-quality was added
- no mutation route behavior changed

## Remaining water-quality visibility gaps

- no water-quality mutation scoping
- no pond-manager or supervisor/admin override expansion
- no feed scoping
- no attachment parent-resource inheritance
- no parent-resource resolver

## Next safe seam

The next safe scoping seam is feed read-scope by pond responsibility, or attachment parent-resource scoping once the resolver work begins.
