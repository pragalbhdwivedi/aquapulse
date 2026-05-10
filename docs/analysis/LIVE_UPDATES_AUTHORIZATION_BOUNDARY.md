# Live Updates Authorization Boundary

## Current Boundary

The HTTP alert surface is bounded by assignment scope. The websocket live-updates surface is not yet bounded by that same assignment rule.

Current live-updates behavior:

- disabled by default
- operator-authenticated when enabled in active Keycloak mode
- local-safe compatible when auth is disabled or local
- not assignment-scoped per alert or per summary snapshot

## Practical Meaning

When enabled, live updates are still a broader authorization surface than:

- `GET /api/alerts`
- `GET /api/alerts/:id`
- alert triage routes

That is why release readiness depends on the feature staying off by default.

## Safe Current Position

- keep websocket transport deferred
- keep HTTP alert authorization as the trusted bounded release surface
- do not describe live updates as authorization-complete yet
