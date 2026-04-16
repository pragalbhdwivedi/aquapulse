# Alerts Local HTTP Cutover Runbook

This runbook explains the alerts-only opt-in HTTP mode for AquaPulse.

## What It Is

- By default, the web app stays mock-backed and the API stays on the in-memory path.
- The alerts workbench can be switched, by itself, onto the HTTP/backend path.
- In local development, the recommended path is:
  - alerts page in `apps/web`
  - local Next bridge at `/api/alerts...`
  - running API backend in `apps/api`
  - backend alerts adapter/runtime configured however you want underneath that seam

Everything outside alerts should still remain mock/in-memory by default after this branch.

## Env Vars That Matter

Frontend-visible vars:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE=mock
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT=proxy
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL=
```

Web server local proxy target:

```env
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

API persistence/runtime vars still default safely, for example:

```env
AQUAPULSE_PERSISTENCE_MODE=in-memory
AQUAPULSE_ENABLE_POSTGRES_ADAPTERS=false
```

## Recommended Local Setup

1. Copy `.env.example` into your local env file workflow.
2. Keep the global web runtime on `mock`.
3. Enable alerts-only HTTP mode with:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT=proxy
```

4. Point the local web proxy at the backend:

```env
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

## How The Bridge Works

- The alerts workbench issues HTTP-style requests to `/api/alerts...`.
- `apps/web/app/api/alerts/route.ts` and `apps/web/app/api/alerts/[...segments]/route.ts` forward those requests.
- The bridge proxies them to `AQUAPULSE_WEB_LOCAL_API_BACKEND_URL`.
- The page-facing repository/query contracts do not change.

## Running Locally

Web app:

```powershell
corepack pnpm --filter @aquapulse/web exec next dev
```

One workable API start path from the current repo shape:

```powershell
corepack pnpm --filter @aquapulse/api exec tsc --project tsconfig.json --outDir dist
node apps/api/dist/main.js
```

If you already use another local TypeScript runner for the API, keep using it and point it at `apps/api/src/main.ts`.

## How To Verify The Cutover

1. Open the alerts page.
2. Look for the runtime note near the workbench header.
3. Confirm it says:
   - `Alerts runtime: HTTP via local proxy`
   - `Target: /api/alerts local bridge`
4. Trigger a queue refresh or an alert action.
5. Confirm requests are reaching the running backend through the local bridge.
6. If the backend is unavailable, the page should now show a clearer developer-facing failure message instead of silently behaving like mocks.

## What Still Stays Mock By Default

- the full app runtime
- non-alert modules in the web app
- default alerts mode when the opt-in env vars are not set
- any backend runtime path not explicitly switched later

## Quick Revert

To go back to the normal prototype-safe default:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=false
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE=inherit
```

That returns the alerts workbench to the mock/in-memory path without changing its page-facing contracts.
