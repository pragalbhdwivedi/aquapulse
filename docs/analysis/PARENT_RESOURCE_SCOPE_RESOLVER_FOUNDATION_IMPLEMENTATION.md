# Parent Resource Scope Resolver Foundation Implementation

## Scope

This pass adds only the internal parent-resource scope resolver foundation needed before future attachment scoping.

It does not change attachment list behavior, attachment detail behavior, file-content access behavior, or any public API contract.

## Implemented foundation

The API now has an internal `ParentResourceScopeResolverService` that can answer:

- `canReadResource(actor, resourceType, resourceId)`

The resolver:

1. normalizes parent resource type aliases into canonical internal types
2. delegates supported types to the existing scoped application-service detail seams
3. returns a structured internal decision instead of changing any route behavior yet

## Current supported parent types

- `alert`
- `task`
- `pond`
- `batch`
- `feed`
- `water-quality`
- `ai`
- `audit`

Plural and common alias forms are normalized internally, for example `alerts` to `alert`.

## Decision model

The resolver currently returns:

- `allow`
- `deny`
- `unknown`
- `defer_local_safe_allow`

In active Keycloak mode:

- supported parent types resolve to `allow` or `deny` using existing bounded read rules
- unsupported parent types resolve to `unknown`

In local-safe mode:

- resolution returns `defer_local_safe_allow`

## What did not change

- attachment controller behavior
- attachment repository filtering
- attachment file access behavior
- frontend attachment behavior
- database schema
- any existing pond, batch, feed, water-quality, task, alert, AI, or audit scoping behavior

## Next seam

The next safe seam is to wire attachment detail and later file-content access to this resolver in active auth mode, denying `unknown` parent types by default while keeping local-safe broad.
