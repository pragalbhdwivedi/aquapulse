# Water-Quality Local HTTP Cutover Runbook

This runbook explains the water-quality-only opt-in HTTP mode for AquaPulse.

If you want the smallest practical local Postgres-backed water-quality stack, use
`docs/runbooks/water-quality-local-postgres-smoke-stack.md` alongside this runbook.

## What It Is

- By default, the web app stays mock-backed and the API stays on the in-memory path.
- The water-quality pond-detail flow can be switched, by itself, onto the HTTP/backend path.
- In local development, the recommended path is:
  - pond detail page in `apps/web`
  - local Next bridge at `/api/water-quality...`
  - running API backend in `apps/api`
  - backend water-quality adapter/runtime configured however you want underneath that seam

Everything outside the water-quality slice should still remain mock/in-memory by default after this branch.

## Env Vars That Matter

Frontend-visible vars:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE=mock
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT=proxy
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_BASE_URL=
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

Optional bounded verification vars:

```env
AQUAPULSE_WATER_QUALITY_VERIFY_WEB_BASE_URL=http://localhost:3000
AQUAPULSE_WATER_QUALITY_VERIFY_API_BASE_URL=http://localhost:4000
AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_BACKEND_ADAPTER=postgres
AQUAPULSE_WATER_QUALITY_VERIFY_POND_ID=pond-1
AQUAPULSE_WATER_QUALITY_VERIFY_READING_ID=wq-1
AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_SEEDED_SMOKE=false
```

## Recommended Local Setup

1. Copy `.env.example` into your local env file workflow.
2. Keep the global web runtime on `mock`.
3. Enable water-quality-only HTTP mode with:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT=proxy
```

4. Point the local web proxy at the backend:

```env
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

## How The Bridge Works

- The pond detail page and water-quality form issue HTTP-style requests to `/api/water-quality...`.
- `apps/web/app/api/water-quality/route.ts` and `apps/web/app/api/water-quality/[...segments]/route.ts` forward those requests.
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

1. Open a pond detail page.
2. Look for the runtime note above the water-quality entry form.
3. Confirm it says:
   - `Water-quality runtime: HTTP via local proxy`
   - `Target: /api/water-quality local bridge`
4. Refresh the pond page and submit a water-quality reading.
5. Confirm requests are reaching the running backend through the local bridge.
6. If the backend is unavailable, the page should show a clearer developer-facing failure message instead of silently behaving like mocks.

For a bounded CLI verification pass:

```powershell
corepack pnpm water-quality:verify-runtime
```

That script verifies:

- backend diagnostics are reachable
- backend water-quality adapter matches `AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_BACKEND_ADAPTER`
- water-quality list, create, and detail requests work through the web bridge

## How To Confirm It Is Truly Postgres-Backed

1. Open `/runtime`.
2. Confirm the diagnostics card shows:
   - `Water-quality runtime: http`
   - `Backend probe: reachable`
   - `Backend water-quality adapter: postgres`
   - `Water-quality cutover status: HTTP + Postgres water-quality cutover verified`
3. Or run `corepack pnpm water-quality:verify-runtime` and confirm the script reports `Backend water-quality adapter: postgres`.

If the backend is reachable but still shows `in-memory`, the pond detail flow is using the real HTTP path but not the Postgres-backed water-quality adapter yet.

## What Still Stays Mock By Default

- the full app runtime
- non-water-quality modules in the web app unless they already have their own explicit opt-in mode
- default water-quality mode when the opt-in env vars are not set
- any backend runtime path not explicitly switched later

## Quick Revert

To go back to the normal prototype-safe default:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=false
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE=inherit
```

That returns the water-quality flow to the mock/in-memory path without changing its page-facing contracts.
