# Pond Responsibility Runtime Impact

## Runtime impact

This pass is additive and internal-only.

Affected areas:

- database schema metadata and migration inventory
- internal API authorization foundation
- focused repository and service tests

Unaffected areas:

- existing HTTP response shapes
- frontend runtime behavior
- current pond, batch, attachment, feed, water-quality, task, alert, AI, and audit route behavior
- local-safe broad behavior

## Local-safe compatibility

`PondReadAuthorizationService` intentionally keeps local-safe broad:

- `canReadPond(...)` returns `true` for local actors
- `listReadablePondIds(...)` returns `undefined` for local actors, which preserves the future meaning of broad mode rather than forcing a bounded filter

## Blast radius

Blast radius is limited because:

- the new service is not yet wired into any existing read endpoint
- the new persistence table is additive
- the active repository remains in-memory by default

## Next safe seam

The next safe enforcement seam is:

1. wire pond read-scope to the new `canReadPond(...)` and `listReadablePondIds(...)` foundation
2. then scope batches by `pondId`
3. then expand pond-linked parent-resource authorization for attachments
