# AI Feedback Backward Compatibility Risk

## Current Compatibility Risk

Backward-compatibility risk is moderate, not high.

The main remaining compatibility surfaces are:

- old clients that still submit feedback without `aiResponseId`
- local-safe/mock flows that intentionally omit `aiResponseId`
- stale explanation objects already present in browser state
- explicit compatibility tests that still prove no-linkage feedback works

## Risk If Hardening Is Global

Global mandatory linkage would be unsafe now because it would break:

- local-safe/mock/demo flows
- tests that intentionally cover compatibility behavior
- any stale explanation payload submitted after a backend/frontend rollout boundary

## Risk If Hardening Is Keycloak-Only

Keycloak-only mandatory linkage is much safer because:

- active-auth explain path now returns linkage
- active-auth frontend forwarding is in place
- out-of-scope linkage already maps naturally to `not found`

## Missing `aiResponseId` Error Recommendation

For active Keycloak mode:

- missing `aiResponseId` should use existing validation-style rejection behavior
- do not use `not found` for missing linkage itself

For supplied but out-of-scope `aiResponseId`:

- keep `not found`

## Compatibility Recommendation

Keep these compatible for now:

- local-safe
- mock
- disabled
- stale or older payload acceptance outside active Keycloak hardening
