# Attachment Scope Resolver Dependency Map

## Goal

Map which parent resource types a future attachment resolver can support first and which must be deferred.

## Dependency table

| Attachment parent type | Existing parent identifier | Parent module has active-auth scope rule today | Extra dependency before safe support | Initial resolver readiness |
| --- | --- | --- | --- | --- |
| `alert` | `resourceId` | Yes | None beyond delegating to alert rule | First-wave support |
| `task` | `resourceId` | Yes | None beyond delegating to task rule | First-wave support |
| `audit` | `resourceId` | Yes | None beyond delegating to audit rule | First-wave support |
| `ai` | `resourceId` | Yes | None beyond delegating to AI history rule | First-wave support |
| `pond` | `resourceId` | No | Pond responsibility model plus pond read-scope | Defer |
| `batch` | `resourceId` | No | Pond responsibility model plus batch read-scope | Defer |
| `water-quality` | `resourceId` | No | Pond responsibility model plus water-quality read-scope | Defer |
| `feed` | `resourceId` | No | Pond responsibility model plus feed read-scope | Defer |
| unknown string | `resourceId` | No | Explicit support plus module rule | Deny/defer |

## Interpretation

The future resolver does not need a schema change to identify parent targets. The dependency is not parent lookup identity, it is parent authorization readiness.

## Recommended rollout rule

Only enable attachment parent resolution for resource types whose parent module already has a stable, tested active-auth visibility rule.

That means the first safe supported set is:

- alerts
- tasks
- audit
- ai

Everything pond-linked should wait until pond responsibility exists.
