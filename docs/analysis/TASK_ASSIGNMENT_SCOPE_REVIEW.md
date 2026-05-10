# Task Assignment Scope Review

## Assignment Fields Today

- `assigneeId` exists on task records
- `pondId` exists on task records
- no `createdBy` or requester field exists
- no team or pond membership table exists

## What `assigneeId` Supports Well

- personal follow-up views
- “my tasks” filtering
- low-risk optional narrowing in UI or query parameters

## What `assigneeId` Does Not Prove

- whether unassigned tasks should still be visible
- whether pond operators should see tasks for their pond even when assigned to someone else
- whether supervisors should see all assignments
- whether create/update flows expect shared visibility

## Current Product Signals

The current tasks page suggests a shared queue:

- “Pending work list”
- “open the first task detail”
- “confirm owner and status”

This does not read like a personal inbox. It reads like a team review surface.

## Recommended Interpretation

`assigneeId` alone is not enough to become the sole backend read-scope rule.

It is suitable for:

- optional focused views
- future layered enforcement when combined with another scope signal

It is not yet sufficient for:

- full backend list restriction
- full backend detail restriction

## Assignment Visibility Risk

If AquaPulse applies assignee-only enforcement now:

- shared queue visibility disappears
- unassigned work becomes ambiguous
- first-task detail loading on the tasks page becomes unstable
- create/update refresh behavior may look inconsistent after mutations

## Recommendation

Treat `assigneeId` as an important scope signal, but not as a complete enforcement model on its own.
