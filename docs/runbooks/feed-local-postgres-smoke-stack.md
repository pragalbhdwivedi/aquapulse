# Feed Local Postgres Smoke Stack

This runbook adds the smallest practical local stack for exercising the real feed HTTP/Postgres path.

It reuses the existing local smoke Postgres container pattern so there is no second database service to maintain.

## What It Gives You

- one local PostgreSQL container for feed smoke testing
- one deterministic feed seed dataset
- migration and seed scripts that do not change default repo runtime behavior
- a bounded verifier flow that can assert the seeded feed dataset

Default development stays unchanged:

- web stays mock by default
- API stays in-memory by default
- local Postgres is optional

## Local Smoke Database Defaults

The compose-backed smoke stack uses these local-only defaults:

```env
AQUAPULSE_FEED_SMOKE_DB_HOST=localhost
AQUAPULSE_FEED_SMOKE_DB_PORT=54329
AQUAPULSE_FEED_SMOKE_DB_NAME=aquapulse
AQUAPULSE_FEED_SMOKE_DB_USER=aquapulse
AQUAPULSE_FEED_SMOKE_DB_PASSWORD=change-me
AQUAPULSE_FEED_SMOKE_DB_SSL_MODE=disable
```

## Start The Local Postgres Container

This reuses the same lightweight local compose stack already used for alerts and water-quality smoke testing:

```powershell
corepack pnpm feed:smoke:db:up
```

To stop it later:

```powershell
corepack pnpm feed:smoke:db:down
```

## Apply Migrations And Load The Seed

```powershell
corepack pnpm feed:smoke:db:prepare
```

That runs:

- the current schema migration
- the deterministic feed smoke seed

The seed includes:

- `3` pond-scoped feed entries for `pond-1`
- additional entries for `pond-2`
- multiple feed types and batches
- recent and older `fedAt` timestamps for stable ordering verification
- stable IDs for list/detail verification
- one high-quantity entry aligned with the current feed anomaly threshold expectations

## Run The API Against The Smoke Database

Set the API env so feed can use the Postgres adapter and report connectivity clearly:

```env
DATABASE_HOST=localhost
DATABASE_PORT=54329
DATABASE_NAME=aquapulse
DATABASE_USER=aquapulse
DATABASE_PASSWORD=change-me
DATABASE_SSL_MODE=disable
AQUAPULSE_PERSISTENCE_MODE=postgres
AQUAPULSE_ENABLE_POSTGRES_ADAPTERS=true
AQUAPULSE_DB_HEALTHCHECK_ON_BOOT=true
```

Then run the API:

```powershell
corepack pnpm --filter @aquapulse/api exec tsc --project tsconfig.json --outDir dist
node apps/api/dist/main.js
```

## Run The Web App In Feed-Only HTTP Mode

Set the web env:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE=mock
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_HTTP_TRANSPORT=proxy
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

Then run the web app:

```powershell
corepack pnpm --filter @aquapulse/web exec next dev
```

## Run The Bounded Verifier

For seeded read verification:

```powershell
$env:AQUAPULSE_FEED_VERIFY_EXPECT_BACKEND_ADAPTER='postgres'
$env:AQUAPULSE_FEED_VERIFY_EXPECT_SEEDED_SMOKE='true'
corepack pnpm feed:verify-runtime
```

That checks:

- backend diagnostics are reachable
- backend feed adapter is `postgres`
- pond-scoped list reads succeed through the local bridge
- the seeded latest entry `feed-1` is returned as the newest `pond-1` row
- create, detail, and update requests succeed through the same HTTP path

## What Success Looks Like

- `/runtime` shows:
  - backend reachable
  - backend feed adapter `postgres`
  - database connectivity `reachable` when boot healthcheck is enabled
  - feed cutover status `HTTP + Postgres feed cutover verified`
- the verifier reports:
  - seeded smoke dataset assertions passed
  - feed list, create, detail, and update requests succeeded

## What Still Remains Default And Safe

- the app does not switch globally to Postgres
- non-feed modules still default to mock/in-memory unless separately switched
- the smoke stack is opt-in and local-only
- alerts, anomaly evaluation, and AI behavior remain bounded by their existing runtime settings
