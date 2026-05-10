# Batch Pond Responsibility Dependency Map

## Goal

Show what must exist before batch read-scope can be enforced safely.

## Current state

The batch model already exposes `pondId`, and the repository already supports list filtering by `pondId`.

That means data linkage is present, but authorization linkage is missing.

## Dependency chain

1. authenticated actor identity
2. durable actor-to-pond responsibility mapping
3. internal pond authorization service
4. pond read-scope rule
5. batch read-scope using batch `pondId`
6. pond-linked attachment inheritance using the same pond-backed parent rule

## What is already available

- authenticated actor identity
- batch `pondId`
- batch list filtering by `pondId`

## What is missing

- responsible pond assignments
- explicit all-pond override model for elevated roles
- reusable `canReadPond(...)` service

## Consequence

Batch read-scope should not be implemented before pond responsibility, because any earlier rule would be a guess about which ponds belong to which operators.

## Safe first enabled resource after pond responsibility

Batches are a strong first beneficiary once pond responsibility exists because:

- the scope anchor is already present
- the list query already supports `pondId`
- list/detail coupling is straightforward
