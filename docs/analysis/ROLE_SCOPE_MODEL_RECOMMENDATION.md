# Role Scope Model Recommendation

## Current Bounded Model

The repo currently has one practical enforced operator role boundary:

- authenticated operator access

That is enough for route hardening, but not enough for safe read-scope design across sensitive history surfaces.

## Recommended Model

Short term, keep the current auth architecture and add a **bounded scope model**, not a full RBAC redesign.

Recommended access tiers for future planning:

### 1. Operator

Use for:

- direct operational work
- own drafts/history
- pond-related read slices where assigned or relevant
- task and alert triage within scoped visibility

### 2. Supervisor / Reviewer

Use for:

- broader queue visibility
- review-oriented read access
- audit history visibility
- shared incident/approval-review visibility

### 3. Admin / Platform

Reserve for future internal/platform-only seams:

- runtime diagnostics expansion
- system-wide audit inspection
- cross-surface support operations

This tier should stay conceptual until the repo intentionally grows beyond the bounded operator model.

## Recommended Enforcement Shapes

### User-owned

Best fit:

- AI history
- AI feedback

### Pond-scoped

Best fit:

- batches
- pond-related alerts
- water-quality and feed if read scoping ever narrows

### Assignment-aware or mixed

Best fit:

- tasks
- alerts queue

### Role-scoped

Best fit:

- audit history
- runtime diagnostics if narrowed later

### Schema-required mixed ownership

Best fit:

- saved alert views
- attachments inherited from parent resources

## Important Constraint

Do not try to jump directly from today’s bounded operator model to a full enterprise RBAC design.

Safer path:

1. keep route hardening simple
2. add narrow scope rules where data already supports them
3. only then formalize broader reviewer/admin semantics
