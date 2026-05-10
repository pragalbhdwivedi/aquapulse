# AI Explanation Response Contract Review

## Current Contract

Current `AiAlertsExplainResponse` includes:

- explanation content
- metadata
- cache
- feedback summary

It does not include:

- `aiResponseId`
- `aiRequestId`
- audit metadata comparable to other operator-assistance responses

## Current Generation Path

Alert explanation generation is handled through `AlertExplanationService`.

Unlike the broader operator-assistance flows, that service does not currently:

- save a durable AI request record
- save a durable AI response record
- return request/response audit IDs

## Consequence

Even though durable AI history exists elsewhere, the alert explanation flow does not currently surface a durable response identity to the frontend.

## Recommendation

Short term:

- add optional `aiResponseId` to the explanation response once the backend can produce it

Optional:

- keep `aiRequestId` internal unless it is needed for debugging or UI support

Reason:

`aiResponseId` is the minimum durable linkage needed for feedback ownership. `aiRequestId` is less important for the user-facing feedback step.
