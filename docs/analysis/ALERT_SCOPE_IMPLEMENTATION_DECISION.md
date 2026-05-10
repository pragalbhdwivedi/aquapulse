# Alert Scope Implementation Decision

## Final Decision

The first safe alert scope implementation slice is:

- scope alert list reads by `assignedTo`
- scope alert detail reads by the same `assignedTo` rule
- scope alert summary reads to the same visible assigned-alert set
- scope bulk operations to the same visible assigned-alert set
- keep local-safe mode broad
- leave saved views and live-updates untouched

## Why This Is The First Safe Slice

It is the only alert visibility rule that is:

- backed by an existing persisted field
- understandable without schema changes
- enforceable across list, detail, summary, and bulk mutation paths
- compatible with the current bounded auth model

## What This Explicitly Defers

- pond-based alert visibility
- unassigned-alert visibility rules
- critical-alert broad visibility
- supervisor/reviewer cross-queue visibility
- owner/admin all-alert visibility
- saved-view ownership
- websocket scoped delivery

## Is Assigned-Alert Scoping Safe Now?

Yes, as a bounded first slice.

## Is Pond-Based Scoping Safe Now?

No.

The repo has `pondId`, but it does not have pond responsibility mapping, so pond-based visibility would be a product guess rather than a safe enforcement rule.

## Recommended Next Branch

- `feature/p1-alert-read-scope-by-assignment`

## Recommended Next Commit

- `feat(auth): scope alert reads and bulk triage by assignment in active auth mode`
