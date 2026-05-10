# P1 Internal Release Candidate Handoff

## Start Here

This is the bounded internal release candidate handoff for AquaPulse P1 authorization hardening and persistence stabilization.

Read these in order:

1. [P1 Release Readiness Checklist](./P1_RELEASE_READINESS_CHECKLIST.md)
2. [P1 Environment Flags](./P1_ENVIRONMENT_FLAGS.md)
3. [P1 Smoke Test Checklist](./P1_SMOKE_TEST_CHECKLIST.md)
4. [P1 Deferred Boundaries](./P1_DEFERRED_BOUNDARIES.md)
5. [P1 Rollback Notes](./P1_ROLLBACK_NOTES.md)

Also keep these companion docs open:

- [Release Boundary: Alerts Live Updates](../release-live-updates-boundary.md)
- [Runtime Diagnostics](../runbooks/runtime-diagnostics.md)
- [Cross-Surface UAT Demo Script And Reviewer Checklist](../runbooks/uat-cross-surface-demo-script-and-reviewer-checklist.md)

## Final Release Decision

P1 is ready for a bounded internal release.

That decision depends on these guardrails staying true:

- live updates remain disabled by default
- local-safe behavior remains preserved
- deferred surfaces stay documented as deferred
- active Keycloak expectations stay explicit for reviewers

## What Is In Scope For This Release

- route protection for major operational modules
- bounded HTTP read scopes across AI history, audit history, tasks, alerts, ponds, batches, water-quality, feed, and attachment metadata
- bounded mutation scopes for audit mutation blocking, water-quality/feed writes, task generic mutations, alert generic mutations, and AI feedback
- durable pond responsibility foundation
- durable AI feedback persistence
- active-auth AI feedback linkage hardening

## What Reviewers Should Expect

### Local-safe mode

- broad and demo-friendly
- no new friction added
- useful for walkthroughs, smoke, and fallback verification

### Active Keycloak mode

- bounded reads and writes enforce the new authorization seams
- out-of-scope detail and existing-record mutation paths usually return not found
- unauthorized create into a bounded target usually returns forbidden
- AI alert feedback now requires `aiResponseId`

## Release Tag Recommendation

`p1-internal-rc1-authz-bounded`
