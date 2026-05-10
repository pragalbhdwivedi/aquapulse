# AI Response Linkage Active Auth Reliability Review

## Active Auth Explain Flow

Current active-auth explain flow is materially reliable:

- `AiController.explainAlert(...)` now threads requester identity
- `AiApplicationService.explainAlert(...)` generates the explanation
- the application service persists an `alerts_explain` request/response pair
- returned response includes `aiResponseId` when that linkage persists

## Why `aiResponseId` Is Usually Available

In current repo behavior:

- in-memory AI repository does not throw on request/response persistence
- Postgres AI repository catches persistence failures internally and returns the record
- the app-service wrapper therefore usually receives successful results and returns `aiResponseId`

That makes normal active-auth runtime effectively reliable for mandatory linkage.

## Remaining Reliability Gaps

`aiResponseId` can still be absent in these cases:

- local-safe/mock adapters that intentionally return simplified explanation payloads
- explicit placeholder paths where no alert explanation service is attached
- older client state holding explanations generated before rollout
- any future repository implementation that starts surfacing write failures differently

## Active Auth Feedback Flow

Current feedback flow is also aligned:

- frontend stores explanation responses in `explanations[alertId]`
- frontend now sends top-level `aiResponseId: explanation.aiResponseId`
- backend still falls back to nested `explanation.aiResponseId`
- backend requires ownership when `aiResponseId` is present

## Conclusion

For normal active Keycloak runtime, `aiResponseId` is reliable enough to require.

For compatibility and non-Keycloak modes, it is not.
