# Audit Mutation Implementation Decision

## Decision

The safest future model is:

- audit writes should primarily happen through the interceptor/runtime-recorder path
- ordinary operators should not manually create or patch audit records in active Keycloak mode
- `POST /api/audit` and `PATCH /api/audit/:id` should be restricted or disabled in active authenticated mode unless a real internal caller is identified
- local-safe mode may remain broad for development/testing stability

## Why

- no frontend product flow uses audit mutation routes
- no runtime business flow uses audit mutation routes
- the public mutation routes do not guarantee metadata alignment
- the interceptor skips `/api/audit`, so these routes do not self-audit through the normal runtime seam
- actor-scoped audit reads already assume a metadata-backed audit trail

## What Should Remain Available

- interceptor-generated audit writes
- runtime recorder persistence
- current actor-scoped audit reads
- local-safe development behavior, if preserving it reduces rollout risk

## What Should Not Remain An Ordinary Operator Capability

- `POST /api/audit` in active Keycloak mode
- `PATCH /api/audit/:id` in active Keycloak mode

## Immediate Safe Implementation Slice

Do not remove routes or contracts first.

First hardening slice:

- keep the endpoints present
- keep local-safe broad
- restrict or disable public audit POST/PATCH for ordinary Keycloak operators
- do not change read-scope behavior
- do not change interceptor or persistence write semantics

## Deferred

- admin-only audit correction route, if a real product requirement appears
- internal service-token route, if runtime ever needs explicit non-interceptor audit writes
- compliance export workflow
- immutable retention model
- audit-access self-auditing

## Recommended Next Branch And Commit

- Branch: `analysis/p1-audit-mutation-route-review`
- Commit: `chore(analysis): review audit mutation routes before hardening`
