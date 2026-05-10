# Realtime And Eventflow Audit

## Realtime Strategy In Use
- Alerts-only websocket gateway
- Implemented in `apps/api/src/modules/alerts/live-updates/alerts-live-updates.service.ts`
- Attached manually during API bootstrap in `apps/api/src/main.ts`
- Transport library: `ws`

## What Is Implemented
- Opt-in websocket gateway on `/ws/alerts`
- Ticket bootstrap endpoint:
  - `GET /api/alerts/live-updates/session`
- Auth-aware subscription handling:
  - disabled/local => bounded bypass
  - keycloak => authenticated operator required
- Ephemeral ticket issuance
- Active connection diagnostics
- Event emission to connected alert clients

## What Is Not Implemented
- No ponds realtime
- No feed realtime
- No tasks realtime
- No water-quality realtime
- No generic event bus
- No event persistence/outbox
- No worker-driven event processing

## Eventflow Pattern
- Runtime action occurs
- Alerts live-updates service emits websocket message to connected clients
- Diagnostics cache records gateway state

This is a local gateway/event push pattern, not a durable event platform.

## Production-Safe Assessment

### Strong
- Alerts-only scope is explicit
- Auth behavior for websocket subscribe is intentionally bounded
- Diagnostics make the opt-in state visible

### Weak / Incomplete
- No general eventing abstraction
- No retry/delivery guarantees
- No horizontal-scaling story
- No durable stream or queue

## Realtime Gaps
- Only one domain uses realtime
- No worker/runtime background processing to support broader event workflows
- No deployment manifests for websocket-oriented scaling or proxying

## Dangerous To Modify
- `alerts-live-updates.service.ts`
- `apps/web/src/features/alerts-live-updates.ts`
- runtime config for websocket target and auth

Reason:
- This seam is narrow but sensitive. It touches bootstrap, auth, diagnostics, and client behavior together.

## Summary
Realtime exists and is real, but only for alerts. It should be described as a bounded local gateway rather than a platform-wide event system.
