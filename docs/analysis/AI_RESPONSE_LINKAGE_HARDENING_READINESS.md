# AI Response Linkage Hardening Readiness

## Verdict

Mandatory `aiResponseId` linkage is close to ready, but only for active authenticated Keycloak mode.

Recommended readiness score:

- overall: `82%`
- active Keycloak flow: `90%`
- local-safe/mock compatibility flow: `40%` by design, because compatibility must remain broad

## Why Readiness Is High

The repo now has all core stage prerequisites:

1. `POST /api/ai/alerts/explain` returns optional `aiResponseId`
2. `POST /api/ai/alerts/explain/feedback` accepts optional `aiResponseId`
3. backend enforces AI response ownership when `aiResponseId` is present
4. frontend explicitly forwards top-level `aiResponseId`
5. feedback still carries the full explanation object, so nested compatibility remains intact

## Why Readiness Is Not 100%

Some intentionally compatible paths still omit `aiResponseId`:

- local-safe/mock explanation flows
- placeholder-style explanation responses when durability is unavailable
- older/stale explanation objects created before the new linkage rollout
- tests and compatibility seams that still exercise feedback without `aiResponseId`

## Safety Recommendation

It is reasonable to harden **active Keycloak mode only** if the implementation:

- requires `aiResponseId` only when requester scope is active Keycloak
- keeps local-safe/mock/disabled mode compatible
- preserves `not found` for out-of-scope `aiResponseId`
- uses validation-style error behavior for missing `aiResponseId`

## Not Ready For

- global mandatory linkage across all modes
- removal of compatibility behavior
- reviewer/admin override models
- any persistence or generation redesign
