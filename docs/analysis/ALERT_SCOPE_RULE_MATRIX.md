# Alert Scope Rule Matrix

| Rule | Can support now without schema change | Requires schema change | Requires pond responsibility mapping | Requires role expansion | Requires frontend copy update |
|---|---:|---:|---:|---:|---:|
| Assigned alerts visible to assignee | Yes | No | No | No | Likely yes |
| Alert detail visible only if assigned to caller | Yes | No | No | No | Minor |
| Summary derived only from visible assigned alerts | Yes | No | No | No | Likely yes |
| Bulk actions limited to assigned visible alerts | Yes | No | No | No | Minor |
| Pond-linked alerts visible to pond managers | No | Yes/Model support | Yes | Likely yes | Yes |
| Unassigned alerts visible to everyone | Yes technically, but not recommended | No | No | No | Yes |
| Unassigned alerts visible only for responsible ponds | No | Yes/Model support | Yes | Likely yes | Yes |
| Critical alerts visible to all operators | Yes technically, but not safely as a product rule | No | No | Yes | Yes |
| Review-state alerts visible to supervisors across ponds | No | No direct schema required, but role support required | No | Yes | Yes |
| Saved views private/shared ownership | No | Yes | No | No | Yes |
| Websocket delivery filtered per user scope | No | No direct schema required, but dedicated scope/session work required | Possibly | Yes | No immediate |

## Recommended Immediate Rule Set

Implementable now:

- assigned alerts visible to assignee
- detail scoped to the same assignment rule
- queue summary computed from the same scoped list
- bulk actions restricted to the same scoped set

Deferred:

- pond-linked scope without assignment
- critical-alert broad visibility
- review-state supervisor visibility
- saved-view ownership
- websocket scope delivery
