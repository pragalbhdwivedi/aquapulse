# P1 Rollback Notes

## Release Posture

This release is mostly authorization hardening and durable persistence stabilization, not new product-surface expansion.

## Fast Rollback Levers

If reviewer friction appears during rollout:

1. prefer configuration rollback before code rollback
2. keep live updates disabled
3. use local-safe mode for demo continuity when active-auth setup is the issue

## Operational Rollback Notes

- live updates should stay off unless explicitly needed
- local-safe remains the lowest-risk demo fallback
- active Keycloak regressions will most likely surface as not found, forbidden, or validation failures on newly bounded paths

## What Not To Roll Back Casually

- pond responsibility schema foundation
- durable AI feedback persistence
- bounded read-scope seams already validated by contract tests

Those are now part of the expected platform baseline for the internal release candidate.

## When To Pause Rollout

Pause the bounded internal rollout if:

- active Keycloak users cannot complete normal pond-linked reads in their assigned scope
- active Keycloak alert explanation feedback fails on the normal explain-to-feedback flow
- live updates appear enabled unexpectedly in a shared environment
- reviewers report cross-operator alert data through a surface that should already be HTTP-bounded
