# Task Scope Implementation Plan

## Summary

Task read scoping is not ready for direct implementation in the same way AI history was.

The repository has enough data to **filter**, but not enough business context to **safely decide the rule**.

## Safest Implementation Order

1. Finalize the intended task visibility model.
2. Decide whether unassigned tasks are:
   - shared to all operators
   - pond-scoped
   - supervisor-visible only
3. Decide whether assignee visibility is:
   - exclusive
   - primary but not exclusive
   - combined with pond scope
4. If a no-schema rule is accepted, implement list and detail scoping together.
5. Only after that, update frontend wording if the shared-queue story changes.

## Best Current Recommendation

Do **not** move directly into task read filtering yet.

Instead, do one more bounded analysis/design pass to settle:

- assignee-only vs mixed visibility
- unassigned task visibility
- whether pond-linked tasks imply pond responsibility visibility

## If a Minimal No-Schema Enforcement Pass Is Still Wanted

The least risky candidate would be:

- scope by `assigneeId`
- keep local-safe mode broad
- scope `list` and `getById` together
- accept that this changes the tasks page from shared queue toward personal inbox semantics

This is technically feasible, but not recommended until product intent is confirmed.

## Suggested Test Coverage For Any Future Implementation

- task list shows only in-scope tasks
- task detail blocks out-of-scope ids
- local mode remains broad
- create/update refreshes do not break when scoped
- tasks page still renders when the filtered list is empty

## Recommended Next Branch

- `analysis/p1-task-visibility-model-finalization`

## Recommended Next Commit

- `chore(analysis): finalize bounded task visibility model before enforcement`
