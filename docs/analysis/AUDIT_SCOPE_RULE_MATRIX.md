# Audit Scope Rule Matrix

| Rule | Safe now | Schema change required | Role model required | Frontend impact risk | Notes |
| --- | --- | --- | --- | --- | --- |
| Operators can read only audit events where `actor_id` equals current user in Keycloak mode | Yes | No | No | Low | Best bounded first rule; uses existing metadata |
| Audit list and detail share the same actor-based rule | Yes | No | No | Low | Must stay aligned to avoid ID-based bypass |
| Out-of-scope audit detail returns not found | Yes | No | No | Low | Matches AI/tasks/alerts scoped detail pattern |
| Metadata-less audit rows hidden from normal operators in active auth mode | Yes | No | No | Low | Needed because mutation routes do not reliably write `actor_id` |
| Local-safe audit visibility remains broad | Yes | No | No | Low | Matches existing repo pattern |
| Disabled-mode broad behavior remains unchanged | Yes | No | No | Low | Outside the active-auth scope decision |
| Normal operators retain broad all-audit visibility | No | No | No | High | Overexposes sensitive cross-module activity |
| Owner/admin all-audit visibility | Not now | No direct schema change required | Yes | Medium | Needs explicit role semantics before enforcement |
| Supervisor limited cross-operator visibility | Not now | No direct schema change required | Yes | Medium | Needs settled reviewer role boundaries |
| Module-level audit visibility by `resource_type` or path | Not now | Not necessarily | Yes | Medium | Possible with current fields, but role semantics are missing |
| Compliance export access | Not now | Possibly | Yes | Medium | Product and retention expectations are not defined yet |
| Audit access self-auditing | Deferred | No direct schema change required | Possibly | Low | Current interceptor skips `/api/audit` to avoid recursion |
| Broad operator `POST /api/audit` and `PATCH /api/audit/:id` remain long-term | No | No | No | Low | Poor fit for an audit trail; should be restricted or removed |
| First implementation requires API contract change | No | No | No | Low | Read scoping can stay internal |
| First implementation requires audit schema change | No | No | No | Low | `actor_id` already exists |

## Current Evidence Behind The Matrix

- `audit_events` has no actor column, but `audit_event_metadata.actor_id` already exists and is indexed.
- The interceptor writes `actorId` for normal runtime audit events.
- Public audit mutation routes currently bypass metadata writing.
- The frontend audit page reads only the list surface and renders a count.
