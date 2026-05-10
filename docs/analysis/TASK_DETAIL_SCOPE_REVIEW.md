# Task Detail Scope Review

## Current Detail Behavior

- `GET /api/tasks/:id` is protected for authenticated operators
- once the caller passes route-level auth, any task id can be read
- there is no coupling between list visibility and detail visibility

## Detail Leak Risk

Yes, detail can leak data if list and detail are not scoped together.

Examples:

- if list becomes assignee-filtered but detail remains broad, a user who knows a task id can still read outside-scope tasks
- if list remains broad and detail becomes narrow, the tasks page can still reveal task titles, statuses, assignees, and pond links in the list before failing on detail

## Current Frontend Coupling

The tasks page:

- loads the first visible task from the list
- then requests detail for that same task
- falls back to preview rendering when full detail is unavailable

That means any future enforcement change must treat list and detail as a paired boundary.

## Safest Detail Rule

The detail rule must match the list rule exactly.

Good:

- same scope model for both
- same actor identity source
- same degraded/local-safe carveout

Risky:

- scoping detail first and list later
- scoping list first and detail later
- using different fields for list and detail visibility

## Recommendation

Do not implement task detail read scoping independently.
Any future task scope hardening should enforce list and detail together in one bounded pass.
