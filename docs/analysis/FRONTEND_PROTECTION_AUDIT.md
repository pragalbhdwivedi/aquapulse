# Frontend Protection Audit

## Summary

The frontend has strong operator guidance, but only moderate real protection.

What the frontend does well:

- derives session/bootstrap state from backend/runtime
- disables protected actions when backend auth is expected but unavailable
- explains `auth_required`, `bypassed_local`, and `degraded` states clearly
- distinguishes advisory-only AI output from real record changes

What it does not do:

- enforce hard route auth walls
- replace backend authorization

## Main UI-Only Protection Zones

### Protected Layout

`apps/web/app/(protected)/layout.tsx`

Status:

- protected in presentation only
- no redirect or hard session block

### Alerts Workbench

Status:

- list/detail/summary/action controls are strongly UI-guarded
- action buttons disable correctly
- detail fallback behavior is explicit

Limit:

- if a backend route is public, the UI guard is not a true protection boundary

### Pond / Task / Feed Forms

Status:

- create/update buttons are guarded through `deriveProtectedOperatorUiGuard`
- read cards are guarded through `deriveProtectedReadUiGuard`

Limit:

- these are usability controls, not authorization controls

### Reports / AI Surface

Status:

- excellent advisory-only messaging
- history/reuse/compare are clearly manual

Limit:

- backend AI routes themselves are currently public, so frontend caution messaging is not a security boundary

### Runtime Page

Status:

- placed under `(protected)`
- explains backend diagnostics and bounded slices

Limit:

- page-level placement does not equal real route auth

## Strongest Frontend Safety Cues

- advisory-only AI wording
- review-before-save wording
- explicit auth-required and degraded messages
- non-alert operator/read summaries

## Weakest Frontend Security Assumption

The frontend often assumes that “protected slice” UI state and backend enforcement are aligned, but that alignment is incomplete on:

- AI
- audit
- attachments
- batches
- selected alerts routes

## Safe Hardening Guidance

Do not treat frontend guard code as the primary security seam.

Safe next step:

- keep the frontend unchanged
- harden backend auth metadata on sensitive routes first
