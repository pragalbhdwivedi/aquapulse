# Pond Responsibility Model Design

## Goal

Define the future-safe responsibility model that lets the system answer:

- which ponds can this actor read?

This is the missing prerequisite for pond-scoped enforcement on:

- ponds
- batches
- water-quality
- feed
- pond-linked attachments

## Recommended product model

Use direct actor-to-pond responsibility as the primary production model.

Recommended semantics:

- operators see only their assigned ponds
- pond managers see all data for ponds assigned to them
- supervisors may later receive broader cross-pond visibility
- owner/admin may later receive all-pond visibility
- local-safe remains broad

## Why direct actor-to-pond mapping first

It is the smallest model that answers the immediate enforcement question.

Compared with team-based or shift-based models, direct assignment:

- is easier to reason about
- is easier to test
- supports batches and pond-linked resources immediately
- does not require RBAC redesign

## Recommended future schema direction

Later schema support should likely include a dedicated mapping table with fields like:

- `id`
- `user_id`
- `pond_id`
- `responsibility_type`
- `active`
- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

Optional later extensions:

- `assigned_by`
- `team_id`
- `shift_id`
- `notes`

## Responsibility types

Recommended minimum set:

- `operator`
- `manager`

Deferred types:

- `supervisor`
- `temporary_shift_cover`

Those broader roles should not be required for the first safe read-scope slice.

## Role interaction guidance

### Data entry / normal operator

- read only assigned ponds in active auth

### Pond manager

- read all ponds directly assigned to them
- no automatic farm-wide visibility by default

### Supervisor

- defer design until after basic pond responsibility exists
- do not bundle supervisor cross-pond logic into the first schema slice

### Owner / admin

- defer explicit all-pond override until later

## Why not start with team-to-pond or role-to-pond mapping

Those models may become useful later, but they add ambiguity now:

- teams do not answer which concrete actor may read today
- role-wide pond visibility can become too broad too quickly
- shift-based access is operationally useful but not required for the first safe batch or attachment seam

## Minimal future service contract

The schema should later support a service that answers:

- `listReadablePondIds(actor)`
- `canReadPond(actor, pondId)`

It should also eventually support:

- `canManagePond(actor, pondId)`

## Local-safe recommendation

Keep local-safe broad.

Do not force pond assignment data into local demo and mock flows.

## First safe enforcement enabled by this model

Once direct actor-to-pond mapping exists:

1. pond list/detail can be scoped
2. batch list/detail can be scoped by `pondId`
3. water-quality and feed can be scoped by `pondId`
4. pond-linked attachments can inherit from parent visibility
