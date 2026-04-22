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
set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT=proxy
set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES=true
set NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE=proxy_bootstrap
corepack pnpm --filter @aquapulse/web dev
```

3. Open the alerts workbench and confirm the runtime block shows:
   - `Alerts runtime: HTTP via local proxy`
   - `Live updates: active` after the websocket connects
   - `Live target: /api/alerts/live-updates/session`
   - `Transport: local_proxy_bootstrap`

4. Run the bounded live-update verifier:

```bash
set AQUAPULSE_ALERTS_LIVE_VERIFY_WS_SUBSCRIPTION_MODE=proxy_bootstrap
corepack pnpm alerts:verify-live-updates
```

Expected verifier behavior:
- it reads backend runtime diagnostics
- it resolves the websocket target through the local bootstrap route when the local proxy transport is active
- it reports whether the subscription is `authenticated` or `bypassed_local`
- it triggers one bounded alerts review-state mutation through the web bridge
- it waits for one bounded alerts live-update event
- it fails clearly if live updates are disabled, unreachable, auth-protected without a forwarded token, or degraded by malformed payload flow

## What this branch does

- Emits bounded live-update events after alert create/update/lifecycle/bulk mutations.
- Refreshes the alerts queue and summary surfaces when a live event arrives.
- Keeps fallback behavior safe: if the websocket gateway is disabled or unreachable, the page stays usable with manual refresh behavior.
- Keeps websocket verification bounded: the verifier exercises one local connection and one representative alerts mutation, not a full realtime harness.

## Diagnostics checks

- Backend health: `http://localhost:4000/api/health`
- Backend runtime: `http://localhost:4000/api/diagnostics/runtime`
- In the runtime diagnostics page, look for:
  - backend alerts adapter mode
  - backend alerts live gateway enabled/attached
  - active websocket connection count
  - frontend live-update state: `disabled`, `idle`, `connecting`, `active`, `degraded`, or `unavailable`
  - fallback mode remaining `manual refresh`

## Auth/runtime interaction

- Live updates remain alerts-only and opt-in.
- Disabled auth mode and local auth mode keep alerts live subscriptions on the bounded `bypassed_local` path.
- In Keycloak mode, alerts live subscriptions are auth-aware and require an authenticated operator websocket subscription.
- The web app can distinguish `authenticated`, `bypassed_local`, `degraded`, and `unavailable` live-update states without changing the default runtime.
- In proxy-bootstrap mode, the web server derives the websocket subscription target from the local alerts bridge and can reuse bounded forwarded auth from `AQUAPULSE_WEB_AUTH_BEARER_TOKEN` or the configured auth cookie.
- `NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN` remains available only for bounded direct websocket verification; the new local proxy-bootstrap path avoids needing that value in the common local flow.
- The verifier can reuse a local forwarded bearer token through `AQUAPULSE_ALERTS_LIVE_VERIFY_BEARER_TOKEN` or `AQUAPULSE_WEB_AUTH_BEARER_TOKEN` when the alerts mutation slices are protected.
- Disabled/local auth modes remain usable without additional setup.
- In active Keycloak mode, missing forwarded auth/current-session alignment should produce a readable degraded verifier/runtime state rather than a silent websocket failure.

## Notes

- The websocket path defaults to `/ws/alerts`.
- If you change `AQUAPULSE_ALERTS_LIVE_UPDATES_PATH`, point the web app at the matching websocket URL through `NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_BASE_URL`.
- `NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_SUBSCRIPTION_MODE=proxy_bootstrap` keeps the local flow server-mediated through `/api/alerts/live-updates/session`.
- `NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_WS_AUTH_TOKEN` is still for bounded local verification only. Do not treat it as a production auth/session pattern.
- If the runtime card shows `degraded`, the websocket connected but the live event stream or payload handling is unhealthy; the queue remains usable with manual refresh.
- Default runtime safety is unchanged when the live-update env vars are not enabled.
