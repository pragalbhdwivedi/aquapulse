# Task Scope Rule Matrix

| Rule | Can support now without schema change | Requires schema change | Requires pond responsibility mapping | Requires creator field | Requires role expansion | Requires frontend copy update |
|---|---|---:|---:|---:|---:|---:|
| Assigned tasks visible to assignee | Yes | No | No | No | No | Likely yes |
| Unassigned tasks visible to everyone | Yes technically, but not recommended | No | No | No | No | Yes |
| Unassigned tasks visible only for managed ponds | No | Yes/Model support | Yes | No | Likely yes | Yes |
| Pond-linked tasks visible to pond managers | No | Yes/Model support | Yes | No | Yes | Yes |
| Cross-pond tasks visible by assignment only | Yes | No | No | No | No | Likely yes |
| Created-by-me visibility | No | Yes | No | Yes | No | Yes |
| Overdue tasks visible to task owner | Yes | No | No | No | No | Minor |
| Overdue tasks visible to supervisors across ponds | No | No direct schema required, but role support required | Likely yes | No | Yes | Yes |
| Supervisor review visibility across all tasks | No | No direct schema required, but role support required | No | No | Yes | Yes |
| Owner/admin all-task visibility | No | No direct schema required, but role support required | No | No | Yes | Yes |
| Completed tasks visible only to prior assignee | Yes | No | No | No | No | Minor |
| Accountant-only finance/inventory task visibility | No | Yes/Model support | No | No | Yes | Yes |

## Recommended Immediate Rule Set

Implementable now:

- assigned tasks visible to assignee
- cross-pond visibility only through assignment
- completed tasks follow the same assignment rule
- overdue tasks follow the same assignment rule
- list and detail use the same scope

Deferred:

- creator-based visibility
- pond-manager visibility
- unassigned task visibility by pond
- supervisor/admin visibility
- accountant-specific visibility
