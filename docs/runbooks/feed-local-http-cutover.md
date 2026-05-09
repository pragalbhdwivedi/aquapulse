# Feed Local HTTP Cutover Runbook

This runbook explains the feed-only opt-in HTTP mode for AquaPulse.

## What It Is

- By default, the web app stays mock-backed and the API stays on the in-memory path.
- The feed page can be switched, by itself, onto the HTTP/backend path.
- In local development, the recommended path is:
  - feed page in `apps/web`
  - local Next bridge at `/api/feed...`
  - running API backend in `apps/api`
  - backend feed adapter/runtime configured however you want underneath that seam

Everything outside the feed slice should still remain mock/in-memory by default after this branch.

## Env Vars That Matter

Frontend-visible vars:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE=mock
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT=proxy
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_BASE_URL=
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
AQUAPULSE_FEED_VERIFY_WEB_BASE_URL=http://localhost:3000
AQUAPULSE_FEED_VERIFY_API_BASE_URL=http://localhost:4000
AQUAPULSE_FEED_VERIFY_EXPECT_BACKEND_ADAPTER=postgres
AQUAPULSE_FEED_VERIFY_POND_ID=pond-1
AQUAPULSE_FEED_VERIFY_ENTRY_ID=feed-1
```

## Recommended Local Setup

1. Keep the global web runtime on `mock`.
2. Enable feed-only HTTP mode with:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT=proxy
```

3. Point the local web proxy at the backend:

```env
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

## How The Bridge Works

- The feed page issues HTTP-style requests to `/api/feed...`.
- `apps/web/app/api/feed/route.ts` and `apps/web/app/api/feed/[...segments]/route.ts` forward those requests.
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

## How To Verify The Cutover

1. Open the feed page.
2. Look for the feed runtime note above the create and update forms.
3. Confirm it says:
   - `Feed runtime: HTTP via local proxy`
   - `Target: /api/feed local bridge`
4. Create or update a feed entry.
5. Confirm requests are reaching the running backend through the local bridge.
6. If the backend is unavailable, the page should show a clearer developer-facing failure message instead of silently behaving like mocks.

For a bounded CLI verification pass:

```powershell
corepack pnpm feed:verify-runtime
```

That script verifies:

- backend diagnostics are reachable
- backend feed adapter matches `AQUAPULSE_FEED_VERIFY_EXPECT_BACKEND_ADAPTER`
- feed list, create, detail, and update requests work through the web bridge

## How To Confirm It Is Truly Postgres-Backed

1. Open `/runtime`.
2. Confirm the diagnostics card shows:
   - `Feed runtime: http`
   - `Backend probe: reachable`
   - `Backend feed adapter: postgres`
   - `Feed cutover status: HTTP + Postgres feed cutover verified`
3. Or run `corepack pnpm feed:verify-runtime` and confirm the script reports `Backend feed adapter: postgres`.

If the backend is reachable but still shows `in-memory`, the feed page is using the real HTTP path but not the Postgres-backed feed adapter yet.

## What Still Stays Mock By Default

- the full app runtime
- non-feed modules in the web app unless they already have their own explicit opt-in mode
- default feed mode when the opt-in env vars are not set
- any backend runtime path not explicitly switched later

## Quick Revert

To go back to the normal prototype-safe default:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=false
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE=inherit
```

That returns the feed flow to the mock/in-memory path without changing its page-facing contracts.
