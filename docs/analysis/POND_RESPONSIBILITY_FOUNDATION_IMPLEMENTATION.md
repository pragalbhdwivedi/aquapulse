# Pond Responsibility Foundation Implementation

## Scope

This pass adds only the durable pond responsibility foundation needed for future pond-scoped authorization.

It does not change current pond, batch, attachment, feed, or water-quality read behavior.

## Added

- additive `pond_responsibilities` database migration
- schema-manifest updates in `@aquapulse/database`
- shared database row support for pond responsibility records
- internal `PondResponsibilityModule`
- in-memory and Postgres pond responsibility repositories
- internal `PondReadAuthorizationService`
- focused repository and service tests

## Internal contract added

The new internal service exposes:

- `canReadPond(actor, pondId)`
- `listReadablePondIds(actor)`

Current semantics:

- active Keycloak mode is bounded by durable pond responsibility rows
- local-safe stays broad
- no existing resource endpoint consumes the service yet

## Data model added

`pond_responsibilities`

Fields:

- `id`
- `user_id`
- `pond_id`
- `responsibility_type`
- `active`
- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

## What stayed intentionally unchanged

- no pond read filtering
- no batch read filtering
- no attachment filtering
- no parent-resource resolver
- no frontend behavior changes
- no auth-internal redesign
- no websocket changes
- no changes to existing AI, audit, task, or alert read-scope behavior

## Why this is the safe first seam

The platform can now store and resolve durable actor-to-pond responsibility without enforcing it yet across product routes.

That keeps current runtime stable while giving the next pond-scoped passes a real authorization anchor.
