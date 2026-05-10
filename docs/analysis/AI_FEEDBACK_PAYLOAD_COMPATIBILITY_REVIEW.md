# AI Feedback Payload Compatibility Review

## Current Payload

The current frontend submits:

- `alertId`
- `value`
- `note`
- `explanation`

It does not currently submit:

- `aiResponseId`
- `aiRequestId`

## Backend Compatibility Status

The current backend feedback path can already tolerate an optional compatibility field if one appears, but the public DTO and shared contract do not officially model it yet.

## Compatibility Recommendation

### Safe next step

- add optional `aiResponseId`
- keep `alertId` required
- do not require `aiResponseId` yet

### Not recommended yet

- making `aiResponseId` mandatory immediately
- adding `aiRequestId` to the required frontend payload

## Backward Compatibility Goal

Existing clients and tests should continue to work when:

- no `aiResponseId` is sent
- local-safe uses placeholder or mock explanation flows

That means the rollout should stay additive until frontend adoption is complete.
