# AI Response Linkage Hardening Implementation Decision

## Decision

Proceed only with a bounded active-auth hardening slice.

## Recommended Rule

Active Keycloak mode:

- `POST /api/ai/alerts/explain/feedback` should require `aiResponseId`
- both checks should then be required:
  - linked alert visibility
  - AI response ownership by `requestedBy`

Missing `aiResponseId`:

- reject with validation-style error behavior

Supplied but out-of-scope `aiResponseId`:

- return `not found`

Local-safe/mock/disabled mode:

- continue allowing feedback without `aiResponseId`

## First Safe Implementation Slice

Only:

- harden `POST /api/ai/alerts/explain/feedback`
- active Keycloak mode only
- no schema change
- no frontend redesign

## Do Not Modify Yet

- AI generation semantics
- durable feedback schema
- reviewer/admin override
- dashboard/reporting surfaces
- prompt governance
- global compatibility behavior

## Final Recommendation

Hardening is safe now **if and only if** it is scoped to active Keycloak mode and keeps local-safe/mock compatibility intact.
