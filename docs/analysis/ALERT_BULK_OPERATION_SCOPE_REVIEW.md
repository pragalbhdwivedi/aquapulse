# Alert Bulk Operation Scope Review

## Current Behavior

Current bulk routes:

- `POST /api/alerts/bulk/acknowledge`
- `POST /api/alerts/bulk/resolve`
- `POST /api/alerts/bulk/assign`
- `POST /api/alerts/bulk/review-state`

They are route-protected today, but they do not yet appear to validate alert ownership or read scope.

## Why Bulk Scope Matters

If alert list visibility is narrowed but bulk actions remain broad:

- callers can still mutate out-of-scope alerts by supplying ids directly
- queue scoping becomes cosmetic rather than authoritative

## Can Bulk Scope Be Added Without Schema Change?

Yes, if and only if the first alert scope rule is:

- assigned alerts only

That would allow a safe bounded implementation:

- validate that all target ids are within the caller’s visible assigned-alert scope
- mutate only those visible records

## What Bulk Scope Cannot Safely Do Yet

- pond-manager scoped bulk triage
- supervisor cross-queue bulk triage
- critical-alert cross-user triage

Those require product and role-model decisions not encoded today.

## Recommendation

Bulk operations can be safely scoped in the same first implementation pass as assigned-alert list/detail reads.

They should not be deferred if list/detail scoping starts, because they would otherwise remain a bypass path.
