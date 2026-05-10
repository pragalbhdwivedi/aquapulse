# Operational Write Scope by Pond Responsibility

## Implemented scope

This pass scopes only:

- `POST /api/water-quality`
- `PATCH /api/water-quality/:id`
- `POST /api/feed`
- `PATCH /api/feed/:id`

## Water-quality behavior

In active authenticated Keycloak mode:

- create now requires pond responsibility for the submitted `pondId`
- update now requires pond responsibility for the existing record's `pondId`
- if update attempts to change `pondId`, the new pond is also validated
- updates against out-of-scope existing records return not found
- creates into unauthorized ponds return forbidden
- retargeting a visible record into an unauthorized pond returns forbidden

In local-safe mode:

- create and update remain broad

## Feed behavior

In active authenticated Keycloak mode:

- create now requires pond responsibility for the submitted `pondId`
- update now requires pond responsibility for the existing feed record's `pondId`
- because the current update DTO does not expose `pondId`, there is no feed retarget path to validate in this pass
- updates against out-of-scope existing records return not found
- creates into unauthorized ponds return forbidden

In local-safe mode:

- create and update remain broad

## Intentionally unchanged

- pond writes
- batch writes
- attachment writes
- task writes
- alert create/update authority
- AI feedback behavior
- pond, batch, water-quality, feed, attachment, task, alert, AI, and audit read scopes
- alert side effects triggered by feed and water-quality creates
- API shapes and frontend behavior

## Error convention used

- out-of-scope direct updates: not found
- create into unauthorized pond: forbidden
- move a visible water-quality record into an unauthorized pond: forbidden

## Why this was safe now

- the repo already had `PondReadAuthorizationService`
- both modules already expose or imply a stable `pondId`
- both modules already had existing record lookup methods for update enforcement
- both modules were already pond-scoped on reads, so the mutation seam now aligns with the read seam

