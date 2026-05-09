# Task Scope Implementation Decision

## Final Decision

The first safe task visibility implementation slice is:

- scope task list reads by `assigneeId`
- scope task detail reads by the same assignee rule
- keep local-safe mode broad
- do not implement unassigned-task sharing yet
- do not implement pond-manager visibility yet
- do not implement supervisor/admin overrides yet

## Why This Is The First Safe Slice

It is the only rule that is:

- backed by existing persistent data
- understandable without schema changes
- enforceable in both repository list and detail reads
- aligned with a bounded first-step ownership model

## What This Decision Explicitly Defers

- shared authenticated queue visibility
- creator fallback visibility
- pond responsibility visibility
- supervisor/reviewer all-task visibility
- owner/admin all-task visibility
- accountant/domain-specific visibility

## Shared Queue Decision

- shared queue stays in local-safe mode
- shared queue should not remain the long-term active-auth visibility model

## Frontend Note

The eventual implementation will likely require small wording cleanup on the tasks page because the current copy describes a shared queue rather than a personal or scoped work list.

That copy update should happen only after backend enforcement is introduced.

## Recommended Next Branch

- `feature/p1-task-read-scope-by-assignee`

## Recommended Next Commit

- `feat(auth): scope task reads by assignee in active auth mode`
