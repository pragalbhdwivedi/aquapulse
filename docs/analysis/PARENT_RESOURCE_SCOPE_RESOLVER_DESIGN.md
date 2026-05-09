# Parent Resource Scope Resolver Design

## Goal

Design a reusable internal resolver that answers:

- can the current operator read this resource?

Primary use case:

- attachment visibility inherited from the linked parent resource

## Current attachment inputs

Attachments already carry:

- `resourceType`
- `resourceId`

That is enough to identify a parent target later without a schema change.

## Proposed internal interface

Suggested future internal contract:

```ts
type ResourceType =
  | "pond"
  | "batch"
  | "alert"
  | "task"
  | "water-quality"
  | "feed"
  | "audit"
  | "ai";

interface ResourceScopeRequester {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles: readonly string[];
}

interface ResourceScopeDecision {
  readonly outcome: "allow" | "deny" | "unknown" | "defer_local_safe_allow";
  readonly reason:
    | "parent_visible"
    | "parent_out_of_scope"
    | "unsupported_resource_type"
    | "missing_parent_scope_model"
    | "missing_parent_record"
    | "local_safe_broad";
}

canReadResource(
  requester: ResourceScopeRequester | undefined,
  resourceType: ResourceType | string,
  resourceId: string
): Promise<ResourceScopeDecision>;
```

## Delegation model by parent type

### Ready to support first

- `alert`
- `task`
- `audit`
- `ai`

Reason:

- these modules already have bounded active-auth read logic in the application layer

### Must be deferred initially

- `pond`
- `batch`
- `water-quality`
- `feed`

Reason:

- they do not yet have stable production scope rules
- pond-linked authorization still depends on a future pond responsibility model

## Recommended delegation rules

### Alert parent

- delegate to alert read visibility rule
- current active-auth rule is assignment-based

### Task parent

- delegate to task read visibility rule
- current active-auth rule is assignee-based

### Audit parent

- delegate to audit read visibility rule
- current active-auth rule is actor-based

### AI parent

- delegate to AI history visibility rule
- current active-auth rule is `requestedBy`-based

### Pond, batch, water-quality, feed parent

- return `unknown` until pond responsibility and parent scope rules exist

### Unknown resource type

- return `unknown` from the resolver
- callers in active auth should treat that as deny
- callers in local-safe can preserve broad behavior

## Why return `unknown`

`unknown` is safer than auto-allow and more expressive than plain deny inside internal architecture.

It lets callers distinguish:

- a true out-of-scope resource
- a resource type the platform is not ready to authorize yet

That matters during staged rollout, testing, and future observability.

## Caller behavior recommendation

### Active authenticated mode

- `allow`: proceed
- `deny`: treat as out of scope
- `unknown`: treat as denied
- `defer_local_safe_allow`: not expected in active auth

### Local-safe mode

- `allow`: proceed
- `deny`: proceed only if the caller intentionally preserves broad local-safe behavior
- `unknown`: proceed if broad local-safe compatibility is still required
- `defer_local_safe_allow`: proceed

## Endpoint-facing convention

For read endpoints:

- out-of-scope detail should become not found
- unsupported/unknown parent types in active auth should also become not found at the endpoint boundary

This avoids leaking whether a linked parent exists but is out of scope.

## Attachment-specific use

Future attachment reads should work like:

1. read attachment metadata
2. extract `resourceType` and `resourceId`
3. call `canReadResource(...)`
4. if allowed, return the attachment
5. if denied or unknown in active auth, treat as not found
6. apply the same rule to detail and any future file-content access
