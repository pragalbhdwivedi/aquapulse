# Alert Saved Views Scope Review

## Current Behavior

Saved views are currently global within the backend surface:

- `GET /api/alerts/views`
- `POST /api/alerts/views`
- `POST /api/alerts/views/:id/remove`

Current persistence shape stores:

- `id`
- `name`
- `preset_id`
- `filter_query`
- timestamps

There is no owner, creator, or sharing field.

## Scope Implication

Saved views do not yet have a real ownership model.

That means AquaPulse cannot safely support:

- private views
- shared team views
- per-user default views
- supervisor-visible shared review views

without schema changes or a new persistence model.

## Immediate Recommendation

Do not include saved-view scoping in the first alert read-scope implementation pass.

Saved views should remain functionally broad until:

- ownership fields exist, or
- the repo intentionally defines a separate storage model

## Schema Gap

Yes, saved-view ownership requires schema support.
