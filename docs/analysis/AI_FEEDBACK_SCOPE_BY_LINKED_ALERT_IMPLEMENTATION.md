# AI Feedback Scope By Linked Alert Implementation

## Scope Applied

This slice scopes:

- `POST /api/ai/alerts/explain/feedback`

It does not change:

- AI generation routes
- AI history list/detail behavior
- AI feedback persistence design
- alert lifecycle routes
- alert triage routes
- frontend contracts or behavior

## Implemented Rule

In active authenticated Keycloak mode:

- feedback submission now requires visibility of the linked alert
- the linked alert is checked through the existing alert assignment-scoped visibility seam
- out-of-scope or missing linked alerts return not found

In local-safe/mock/disabled mode:

- existing broad feedback behavior remains unchanged

## Why This Slice Is Safe

- the route already carries `alertId`
- alert visibility scoping already exists and is trusted
- no schema changes were required
- no frontend contract changes were required
- placeholder feedback persistence remains untouched

## What Stayed Intentionally Broad

- no `requestedBy` ownership validation yet
- no durable `aiResponseId` or `aiRequestId` ownership model
- no reviewer/admin override
- no cross-user AI review workflow

## Error Behavior

- out-of-scope linked alert: `not found`
- missing linked alert: `not found`

That keeps the route aligned with existing alert scope masking and avoids leaking alert existence.
