# Feed Write Scope Review

## Surfaces

- `POST /api/feed`
- `PATCH /api/feed/:id`

## Current behavior

- authenticated and operator-role protected
- no pond-responsibility mutation check
- create writes a pond-linked record and triggers alert upsert side effects
- update writes directly with no current-record visibility check

## Available scope field

- create: `pondId` is present now
- create also carries optional `batchId`
- update DTO does not expose `pondId`, but the stored feed entry already belongs to a pond

## Sensitivity

Very high.

Reasons:

- feed writes alter pond-linked operational history
- creates can trigger alerts through `evaluateFeedAlertDecisions(...)`
- broad writes could create false operational history and cross-pond alert churn

## Enforcement readiness

Safe now.

## Recommended future model

- create
  - require pond responsibility for payload `pondId`
- update
  - load current record
  - require pond responsibility for the current record's pond
- if future contracts later allow `pondId` mutation, validate the new target pond too

## Frontend impact risk

Moderate. Feed create/update are active in the web app.

