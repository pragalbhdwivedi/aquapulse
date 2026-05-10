# Batch Scope Runtime Impact

## Runtime impact

This pass changes only batch read behavior in active authenticated mode.

Affected backend seams:

- batch controller read path
- batch application-service read path
- batch repository list filtering

Unaffected seams:

- batch create/update
- ponds
- attachments
- feed
- water-quality
- task, alert, AI, and audit scope behavior
- frontend response shapes

## Local-safe compatibility

Local-safe is preserved intentionally:

- list remains broad because `listReadablePondIds(...)` returns `undefined`
- detail remains broad because local actors do not take the bounded pond path

## Frontend impact

Frontend runtime remains stable because:

- the contract shape is unchanged
- existing batch consumers still call the same list/detail endpoints
- local-safe mock and development flows stay broad

In active Keycloak mode, visible batch datasets may now shrink to ponds the actor is responsible for.

## Blast radius

Blast radius is limited because:

- only `batches.list` and `batches.getById` changed
- no pond-linked child-resource authorization was added yet
- no mutation route behavior changed

## Remaining batch visibility gaps

- no batch mutation scoping
- no pond-manager or supervisor/admin override expansion
- no feed or water-quality scoping
- no attachment parent-resource inheritance
- no parent-resource resolver

## Next safe seam

The next safe scoping seam is pond-linked feed or water-quality read-scope, or attachment parent-resource scoping once the resolver work begins.
