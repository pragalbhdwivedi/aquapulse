# AI Feedback Response Linkage Hardening Implementation

## Scope

This slice hardens only:

- `POST /api/ai/alerts/explain/feedback`

It does not change:

- explanation generation semantics
- feedback persistence schema
- frontend UI
- alert lifecycle behavior
- local-safe/mock compatibility

## What Was Added

In active authenticated Keycloak mode, alert explanation feedback now requires `aiResponseId`.

That requirement is enforced in the AI application-service feedback path after linked alert visibility is checked and before AI response ownership resolution proceeds.

## Error Behavior

### Missing `aiResponseId`

Active Keycloak mode:

- rejected with validation-style error behavior
- uses the project `VALIDATION_ERROR` convention

Local-safe/mock/disabled mode:

- still allowed

### Supplied but invalid or out-of-scope `aiResponseId`

- still returns not found

### Missing or out-of-scope linked alert

- still returns not found

## Active Auth Authorization Model

In active Keycloak mode, feedback now requires all of the following:

1. linked alert is visible to the caller
2. `aiResponseId` is present
3. the AI response belongs to the caller through the existing `requestedBy` seam

## Preserved Behavior

- durable feedback persistence remains unchanged
- frontend payload compatibility remains intact
- nested explanation compatibility path remains intact
- local-safe broad behavior remains intact

## Tests Covered

- active Keycloak feedback without `aiResponseId` is rejected
- active Keycloak feedback with visible alert and owned `aiResponseId` succeeds
- active Keycloak feedback with out-of-scope alert still returns not found
- active Keycloak feedback with out-of-scope `aiResponseId` still returns not found
- local-safe feedback without `aiResponseId` still works
