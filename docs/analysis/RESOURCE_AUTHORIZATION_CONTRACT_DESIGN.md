# Resource Authorization Contract Design

## Goal

Document the future internal contracts for reusable resource authorization checks.

This is an internal design only, not an API contract change.

## Shared requester input

Recommended shared actor shape:

```ts
interface AuthorizationActor {
  readonly id: string;
  readonly provider: "keycloak" | "local";
  readonly roles: readonly string[];
}
```

This aligns with the current `AuthenticatedUserSession` shape without changing auth internals.

## Core contracts

### Resource-level

```ts
canReadResource(
  actor: AuthorizationActor | undefined,
  resourceType: string,
  resourceId: string
): Promise<ResourceScopeDecision>;
```

### Pond-level

```ts
canReadPond(
  actor: AuthorizationActor | undefined,
  pondId: string
): Promise<ResourceScopeDecision>;
```

### Batch-level

```ts
canReadBatch(
  actor: AuthorizationActor | undefined,
  batchId: string
): Promise<ResourceScopeDecision>;
```

### Attachment-level

```ts
canReadAttachment(
  actor: AuthorizationActor | undefined,
  attachmentId: string
): Promise<ResourceScopeDecision>;
```

### Future mutation-level

```ts
canMutateResource(
  actor: AuthorizationActor | undefined,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<ResourceScopeDecision>;
```

## Output contract

```ts
interface ResourceScopeDecision {
  readonly outcome: "allow" | "deny" | "unknown" | "defer_local_safe_allow";
  readonly reason: string;
}
```

## Failure behavior

The contract should avoid throwing for ordinary authorization outcomes.

Recommended behavior:

- return `allow` when clearly in scope
- return `deny` when clearly out of scope
- return `unknown` when the resource type, scope model, or dependency is not ready
- return `defer_local_safe_allow` when the environment intentionally stays broad

Only exceptional system failures should throw:

- repository outage
- dependency misconfiguration
- malformed required identifiers

## Active auth behavior

In active authenticated Keycloak mode:

- `allow` means proceed
- `deny` means block
- `unknown` should be treated as blocked for enforcement

## Local-safe behavior

In local-safe mode:

- callers may preserve existing broad compatibility
- `defer_local_safe_allow` is the most explicit representation of that choice

## Unknown-resource behavior

For unknown or unsupported `resourceType` values:

- internal contract returns `unknown`
- active-auth callers should deny
- local-safe callers may preserve broad behavior until enforcement reaches that surface

## Not-found vs forbidden convention

### Read endpoints

- use not found for out-of-scope detail
- use not found for unsupported/unknown parent types in active auth when checking a specific linked record

This matches the repo's current bounded read pattern and reduces existence leaks.

### Mutation endpoints

- use forbidden when the route itself is intentionally blocked by role or mode
- use not found only when mutation first depends on confirming in-scope resource visibility

## Recommended implementation style

Keep authorization contracts inside internal application/service seams, not inside shared packages.

That preserves:

- current API contracts
- current frontend assumptions
- current auth internals
