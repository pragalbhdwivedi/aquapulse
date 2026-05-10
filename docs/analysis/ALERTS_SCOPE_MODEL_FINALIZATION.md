# Alerts Scope Model Finalization

## Decision Summary

Alerts should use a **narrow immediate model** plus a **deferred richer model**.

This is stricter than the current broad operator queue, but more cautious than trying to implement pond-manager or supervisor visibility before the repo supports it.

## Final Recommended Alerts Visibility Model

### Immediate Enforceable Model

In active authenticated mode:

- operators see alerts assigned to them
- list and detail must use the same visibility rule
- summary reads must be derived from the same visible list scope
- bulk actions must only affect alerts that are already visible to that operator
- out-of-scope detail reads should return not found
- out-of-scope bulk targets should not be mutated

### Immediate Non-Goals

Do not implement yet:

- pond-linked visibility without assignment
- critical-alert broad visibility
- supervisor review visibility
- owner/admin all-alert visibility
- saved-view private/shared ownership
- websocket per-user or per-scope alert delivery

### Deferred Richer Model

Future model, only when repo support exists:

- owner/admin all-alert visibility
- supervisor all-critical or review-state-driven visibility
- pond-manager pond-scoped visibility
- broader escalation visibility
- saved-view private/shared ownership rules
- live-updates subscription scoped to the caller's alert visibility

## Why Alerts Are Harder Than Tasks

The alerts surface is not just a detail page. It is a shared operational workbench with:

- queue-level list reads
- summary aggregation
- bulk triage actions
- saved views
- assignment and review-state workflows
- live-updates bootstrap and websocket delivery

Because of that, changing read scope without a full surface model would create inconsistent queue behavior very quickly.

## Final Product Decision

The broad shared alert queue should remain:

- in local-safe mode
- in current mock/demo mode
- until the first bounded active-auth read-scope pass is implemented

It should not remain the final active-auth visibility rule once scoping starts.
