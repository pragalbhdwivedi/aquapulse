# AI Feedback Authorization Rule Matrix

## Current Route

- `POST /api/ai/alerts/explain/feedback`

## Recommended Rules

### If `alert_id` is present

- require linked alert visibility

### If `ai_response_id` is present

- require AI response ownership by `requestedBy`

### If both are present

- require both checks

### If neither is present in active auth

- reject or defer; do not create an unlinked durable feedback record

### Local-safe/mock/disabled mode

- keep broad behavior

## Model Comparison

### Model A: alert only

- security strength: medium
- schema impact: new table still needed
- API impact: none
- frontend impact: none
- recommended timing: compatibility-only

### Model B: response only

- security strength: high
- schema impact: new table needed
- API impact: likely required
- frontend impact: required
- recommended timing: later

### Model C: alert plus response

- security strength: highest
- schema impact: new table needed
- API impact: additive now, stronger later
- frontend impact: later
- recommended timing: target model

### Model D: alert required now, response optional now, response required later

- security strength: medium now, high later
- schema impact: new table needed
- API impact: optional additive first
- frontend impact: deferred first, required later
- recommended timing: best migration path

## Reviewer/Admin Override

Reviewer/admin override should remain deferred.

The first durable implementation should stay inside:

- linked alert visibility
- AI response ownership where present

without adding cross-user review authority.
