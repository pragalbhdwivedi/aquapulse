# Release Boundary: Alerts Live Updates

For the current bounded internal release, alerts live updates are intentionally out of the default rollout.

## Default State

- backend live updates are disabled by default
- frontend live-updates connector is disabled by default
- explicit opt-in is required to activate websocket bootstrap and subscription flow

## Enabling Flag

Backend enablement requires:

```bash
AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES=true
```

Frontend testing or local opt-in may also set:

```bash
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES=true
```

## Why This Boundary Exists

Live updates are not yet assignment-scoped. The HTTP alert read and mutation surfaces are bounded; the websocket stream is not yet held to the same per-operator visibility rule.

## Release Guidance

- keep live updates off for bounded internal rollout
- enable only for explicit local or controlled verification
- do not treat websocket delivery as authorization-complete until assignment-aware scoping exists
