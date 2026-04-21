# Alerts Live Updates Local Runbook

Alerts live updates are opt-in and alerts-only. Default AquaPulse runtime stays mock/in-memory, and nothing in this runbook changes the safe default path unless you explicitly enable the websocket layer.

## Minimal local flow

1. Start the API with alerts HTTP mode and the websocket gateway enabled:

```bash
set AQUAPULSE_ENABLE_POSTGRES_ADAPTERS=true
set AQUAPULSE_PERSISTENCE_MODE=postgres
set AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES=true
corepack pnpm --filter @aquapulse/api dev
```

2. Start the web app with alerts HTTP mode and live updates enabled:

```bash
set NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE=http
set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT=direct
set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL=http://localhost:4000
set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES=true
corepack pnpm --filter @aquapulse/web dev
```

3. Open the alerts workbench and confirm the runtime block shows:
   - `Alerts runtime: HTTP`
   - `Live updates: active` after the websocket connects
   - a websocket target ending in `/ws/alerts`

## What this branch does

- Emits bounded live-update events after alert create/update/lifecycle/bulk mutations.
- Refreshes the alerts queue and summary surfaces when a live event arrives.
- Keeps fallback behavior safe: if the websocket gateway is disabled or unreachable, the page stays usable with manual refresh behavior.

## Diagnostics checks

- Backend health: `http://localhost:4000/api/health`
- Backend runtime: `http://localhost:4000/api/diagnostics/runtime`
- In the runtime diagnostics page, look for:
  - backend alerts adapter mode
  - backend alerts live gateway enabled/attached
  - active websocket connection count

## Notes

- The websocket path defaults to `/ws/alerts`.
- If you change `AQUAPULSE_ALERTS_LIVE_UPDATES_PATH`, point the web app at the matching websocket URL through `NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL`.
- Default runtime safety is unchanged when the live-update env vars are not enabled.
