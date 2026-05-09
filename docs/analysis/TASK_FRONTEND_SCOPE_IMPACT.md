# Task Frontend Scope Impact

## Current Frontend Assumptions

The tasks page currently assumes:

- a broad pending-work list is available
- the first visible task can be used as the selected detail example
- task creation can refresh a pond-filtered slice
- task update can refresh both list and detail using the same visible task

## Surfaces Affected By Future Scope Enforcement

- `apps/web/app/(protected)/tasks/page.tsx`
- `apps/web/app/(protected)/tasks/_components/task-detail-read-card.tsx`
- `apps/web/src/features/task-create.ts`
- `apps/web/src/features/task-update.ts`
- `apps/web/src/queries/index.ts`

## Frontend Risk If Assignee-Only Scoping Is Applied Early

- the default pending-work list may become unexpectedly empty
- the “first task detail” demo/read path may disappear for many users
- refresh-after-create and refresh-after-update may feel inconsistent
- operators may think tasks were lost rather than intentionally scoped

## Frontend Risk If Pond-Only Scoping Is Applied Early

- there is no existing pond membership model to explain why a user can or cannot see a task
- operators could see different pond slices with no visible explanation

## Local-Safe Impact

Local-safe flows currently rely on broad readability:

- mock and local modes show a simple shared task queue
- current UAT/demo copy assumes that shared visibility

Changing that behavior too early would make local/demo flows harder to explain even if auth/runtime stayed technically correct.

## Recommendation

Frontend impact is moderate-to-high.
Future enforcement should be paired with:

- a clear scope rule
- coupled list/detail behavior
- updated operator copy only after the backend rule is chosen
