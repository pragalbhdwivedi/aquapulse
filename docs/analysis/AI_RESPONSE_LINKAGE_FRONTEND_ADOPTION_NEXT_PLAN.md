# AI Response Linkage Frontend Adoption Next Plan

## Current Backend-Compatible State

Backend now supports optional durable response linkage for alert explanation feedback without requiring frontend migration.

Current effective compatibility path:

1. explanation response may include `aiResponseId`
2. frontend stores the returned explanation object as it already does today
3. feedback submission resends that explanation object
4. backend can read nested `explanation.aiResponseId`

## Recommended Next Rollout Seam

Stage 2 frontend adoption should make linkage explicit rather than implicit.

Recommended follow-up:

1. keep storing the explanation object in UI state
2. additionally surface `aiResponseId` as first-class local state
3. send top-level `aiResponseId` in feedback submissions
4. add UI tests proving the field survives explain-to-feedback flow

## Why Explicit Frontend Adoption Still Helps

- reduces reliance on nested explanation payload shape
- makes future contract hardening clearer
- simplifies telemetry and debugging around feedback ownership failures
- prepares for later mandatory `aiResponseId` enforcement

## Hardening After Frontend Adoption

After frontend adoption is stable:

1. require `aiResponseId` for active-auth alert feedback
2. require both:
   - linked alert visibility
   - AI response ownership by `requestedBy`
3. keep local-safe broad

## Deferred

- mandatory `aiRequestId`
- reviewer/admin override
- dashboards and analytics
- cross-user AI review workflow
- prompt governance UI
