# Water-Quality Write Scope Review

## Surfaces

- `POST /api/water-quality`
- `PATCH /api/water-quality/:id`

## Current behavior

- authenticated and operator-role protected
- no pond-responsibility mutation check
- create writes a pond-linked record and triggers alert upsert side effects
- update writes directly with no current-record visibility check

## Available scope field

- create: `pondId` is present now
- update: existing record contains `pondId`
- update DTO also allows `pondId?`

## Sensitivity

Very high.

Reasons:

- creates and updates directly affect pond-linked operational data
- creates can trigger alerts through `evaluateWaterQualityAlertDecisions(...)`
- overbroad writes can create cross-pond data pollution and cross-module alert noise

## Enforcement readiness

Safe now.

## Recommended future model

- create
  - require `canReadPond(...)` or future `canMutatePond(...)` for payload `pondId`
- update
  - load current record
  - require pond responsibility for the current record's pond
  - if the submitted patch changes `pondId`, require pond responsibility for the new pond too

## Frontend impact risk

Moderate. Water-quality forms are active in the web app, so actors without the right pond responsibility would start seeing legitimate mutation failures once enforced.

