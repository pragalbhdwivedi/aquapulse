# Task Read-Scope By Assignee Implementation

## Scope Applied

This pass implements the first bounded task read-scope enforcement seam only:

- `GET /api/tasks`
- `GET /api/tasks/:id`

## Final Runtime Rule

In active authenticated Keycloak mode:

- task list reads are scoped to `assigneeId === current user id`
- task detail reads are allowed only when the task is assigned to the current user
- out-of-scope detail reads return `not found`

In local-safe and disabled modes:

- broad task visibility remains unchanged

## Implementation Shape

- controller reads the current hydrated user from the existing request user seam
- application service decides whether scoping should apply
- scoping applies only to `provider === "keycloak"`
- repository list reads use the existing assignee filter
- scoped detail reads resolve through the same list-based filter path to keep list/detail behavior coupled

## What This Does Not Change

- task create behavior
- task update behavior
- task assignment semantics
- unassigned task sharing
- pond-scoped visibility
- creator-based visibility
- supervisor/admin overrides

## Tests Added

- keycloak user only sees their assigned tasks in task list reads
- out-of-scope task detail returns not found
- unassigned task detail also returns not found in active authenticated mode
- local-safe visibility remains broad
