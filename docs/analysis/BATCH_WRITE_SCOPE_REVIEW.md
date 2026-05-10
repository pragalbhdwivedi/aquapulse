# Batch Write Scope Review

## Surfaces

- `POST /api/batches`
- `PATCH /api/batches/:id`

## Current behavior

- authenticated and operator-role protected
- no batch write scoping
- application service directly calls repository `create(...)` and `update(...)`

## Data-model finding

Current DTOs are skeletal:

- `CreateBatchesDto` only has `id?`
- `UpdateBatchesDto` only has `id?`

That means the public controller/service seam does not currently expose a stable target pond or meaningful editable fields for batch write authorization.

## Sensitivity

High, because batches are pond-linked operational records and are already pond-scoped on reads.

## Enforcement readiness

Not safe now.

Reason:

- the future rule should likely be pond-responsibility based
- but the current mutation surface is too placeholder-like to enforce meaningfully

## Recommendation

- defer batch write scoping
- revisit only after the batch mutation contract is clarified enough to carry a real pond-linked target

## Frontend impact risk

Low to moderate today because the web API client does not expose batch create/update, but backend behavior should still not be changed blindly.

