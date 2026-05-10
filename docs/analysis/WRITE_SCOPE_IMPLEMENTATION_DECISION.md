# Write Scope Implementation Decision

## Current write-scope maturity

Approximate maturity: 30%.

Reasoning:

- route-level auth and operator role protection are broadly present
- read-scope foundations now exist across multiple modules
- audit mutation is hardened
- alert triage is partially scoped
- but most operational create/update routes still lack target-resource mutation checks

## Highest-risk broad write routes

1. `POST /api/water-quality`
2. `PATCH /api/water-quality/:id`
3. `POST /api/feed`
4. `PATCH /api/feed/:id`
5. `POST /api/alerts`
6. `POST /api/tasks`
7. `PATCH /api/tasks/:id`

## Safe-to-scope-now routes

- `POST /api/water-quality`
- `PATCH /api/water-quality/:id`
- `POST /api/feed`
- `PATCH /api/feed/:id`

These are the cleanest first slice because pond responsibility already exists and the records are plainly pond-linked.

## Routes requiring schema or product-model support

- batches create/update
- attachments create/update

These are blocked more by thin placeholder-like mutation contracts than by a missing read-scope foundation.

## Routes requiring future role model support

- ponds create/update
- alert create
- broader alert patch authority
- task create/update semantics
- generic AI scaffolding writes

## Recommended model

### Active Keycloak mode

- pond-linked operational writes should require pond responsibility
- parent-linked writes should require parent-resource visibility
- direct assignment workflows should require a dedicated task/alert write model
- audit mutation should stay blocked for ordinary operators
- generic system-scaffolding writes should not remain ordinary operator capabilities long-term

### Local-safe mode

Keep broad behavior.

## First safe implementation slice

Implement only:

1. water-quality write scoping by pond responsibility
2. feed write scoping by pond responsibility

Do not combine those with task, alert, pond, batch, or attachment mutation changes in the same first slice.

## Modules that should not be modified yet

- ponds mutations
- batches mutations
- attachments mutations
- task mutations
- alert create authority
- generic AI create/update

