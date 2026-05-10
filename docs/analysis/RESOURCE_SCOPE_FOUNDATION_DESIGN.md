# Resource Scope Foundation Design

## Purpose

This document defines the reusable authorization foundation that should exist before future scope enforcement is added for:

- attachments
- batches
- other parent-linked or pond-linked resources

It does not change current runtime behavior.

## Existing repo pattern

The repo already has a bounded active-auth scope pattern in several modules:

- AI history scopes list/detail by `requestedBy`
- tasks scope list/detail by `assigneeId`
- alerts scope list/detail and mutations by `assignedTo`
- audit scopes list/detail by `actorId`

That pattern is:

1. resolve a small requester object from `AuthenticatedUserSession`
2. only narrow behavior in active authenticated Keycloak mode
3. keep local-safe broad
4. scope list first
5. make detail reuse the same bounded lookup
6. return not found for out-of-scope detail

The future resource-scope foundation should reuse that pattern rather than replace it.

## Foundation layers

### Layer 1: Requester scope context

A future internal requester context should stay small and derived from the current session model:

- `id`
- `provider`
- `roles`

Optional later additions:

- `responsiblePondIds`
- `teamIds`
- `effectiveScopeMode`

### Layer 2: Pond responsibility service

This layer answers:

- which ponds can this actor read?
- does this actor have broad farm-wide pond visibility?

This is the missing foundation for:

- ponds
- batches
- water-quality
- feed
- any pond-linked attachment parents

### Layer 3: Parent resource scope resolver

This layer answers:

- can this actor read a specific parent resource?

It should dispatch by `resourceType` and delegate to the corresponding module rule instead of duplicating module-specific logic.

### Layer 4: Resource-specific adapters

Example future callers:

- attachment read checks
- attachment file-content checks
- batch detail checks
- pond-linked detail checks

## Recommended resolver result model

The resolver should support more than boolean allow/deny.

Recommended result states:

- `allow`
- `deny`
- `unknown`
- `defer_local_safe_allow`

Meaning:

- `allow`: caller is in scope
- `deny`: caller is definitely out of scope
- `unknown`: the resolver cannot safely decide because the type is unsupported, data is missing, or the parent module does not yet have a stable scope rule
- `defer_local_safe_allow`: local-safe or mock mode intentionally stays broad

## Parent modules and current readiness

### Already scope-capable today

- `alerts`
- `tasks`
- `audit`
- `ai`

These modules already have active-auth read-scope logic that a future resolver can delegate to.

### Not scope-capable yet

- `ponds`
- `batches`
- `water-quality`
- `feed`

These modules do not yet have production read-scope enforcement logic.

## Active-auth default behavior

In future active Keycloak mode:

- known supported resource types should delegate to their module rule
- unknown or unsupported resource types should deny by default
- missing parent records should resolve as not found at the endpoint boundary

## Local-safe default behavior

Local-safe should remain broad:

- list behavior stays broad
- detail behavior stays broad
- unsupported parent types should not break demos or development

The resolver can surface `defer_local_safe_allow` internally while the caller preserves current broad behavior.

## First safe post-design slice

1. define the internal requester context contract
2. define a pond responsibility model and durable mapping
3. add pond read-scope
4. add batch read-scope through pond responsibility
5. add parent-resource scope resolver for attachments
