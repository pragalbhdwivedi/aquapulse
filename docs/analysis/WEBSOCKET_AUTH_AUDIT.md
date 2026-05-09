# Websocket Auth Audit

## Scope

Realtime behavior is limited to alerts live updates.

There is no broader cross-domain websocket/event authorization model to audit.

## What Is Implemented

`apps/api/src/modules/alerts/live-updates/alerts-live-updates.service.ts`

Implemented protections:

- websocket gateway only attaches when live updates are enabled
- Keycloak mode:
  - requires verified bearer token or ephemeral subscription ticket
  - requires operator access
- invalid or expired tickets are rejected
- missing or invalid auth is rejected with `401`
- insufficient access is rejected with `403`

## Strengths

- websocket auth is stricter than several HTTP seams
- ephemeral ticket bootstrap avoids exposing a long-lived credential in the websocket URL in the normal path
- subscription state is tracked and surfaced in diagnostics

## Weak Points

- no explicit origin validation
- no per-message authorization model, though the channel is receive-only today
- no ticket binding to user/session/IP
- no mid-connection revalidation if auth posture changes
- bootstrap issuance is handled by a controller route without route decorators, relying on service-level checks

## Overall Assessment

Status:

- partially hardened but bounded

Reason:

- connection-time authorization is real
- broader transport hardening is intentionally absent
- blast radius is limited because the websocket appears broadcast-only

## Safe Hardening Opportunity

Safest next websocket hardening seam:

- add explicit origin/host allowlist validation and keep everything else unchanged

This would improve security without redesigning the realtime model.
