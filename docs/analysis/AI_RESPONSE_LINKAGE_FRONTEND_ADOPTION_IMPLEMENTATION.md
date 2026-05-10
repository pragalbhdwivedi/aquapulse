# AI Response Linkage Frontend Adoption Implementation

## Scope

This slice adopts explicit frontend forwarding of optional AI response linkage for alert explanation feedback.

Changed areas:

- alert explanation state reuse path in the protected alerts workbench
- feedback submission payload
- focused frontend contract coverage

Unchanged:

- backend route behavior
- AI generation semantics
- feedback persistence schema
- alert lifecycle and triage behavior
- local-safe behavior

## What Was Added

When alert explanation feedback is submitted from the alerts workbench, the frontend now forwards:

- `aiResponseId: explanation.aiResponseId`

This is sent as a top-level optional field alongside the existing payload:

- `alertId`
- `value`
- `note`
- `explanation`

## Where `aiResponseId` Is Preserved

The current workbench already stores alert explanations by alert ID in:

- `explanations[alertId]`

Because the full explanation response is stored there, any optional `aiResponseId` returned by `POST /api/ai/alerts/explain` is preserved automatically without introducing a new state shape.

## Backward Compatibility

The adoption remains compatibility-safe:

- if `aiResponseId` exists, it is forwarded explicitly
- if `aiResponseId` is missing, feedback still submits successfully
- no UI flow or feedback interaction changed
- no frontend migration gate was introduced

## Tests Added

- explanation responses with `aiResponseId` are preserved and forwarded in the feedback request body
- feedback still works when `aiResponseId` is unavailable

## Why This Slice Is Safe

- state model was already capable of preserving the field
- route contracts were already additive-compatible
- backend compatibility behavior remains unchanged
- local-safe/mock feedback paths still behave the same
