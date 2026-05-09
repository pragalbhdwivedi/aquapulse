# Water-Quality Local Postgres Smoke Stack

This runbook adds the smallest practical local stack for exercising the real water-quality HTTP/Postgres path.

It reuses the existing local smoke Postgres container pattern so there is no second database service to maintain.

## What It Gives You

- one local PostgreSQL container for water-quality smoke testing
- one deterministic water-quality seed dataset
- migration and seed scripts that do not change default repo runtime behavior
- a bounded verifier flow that can assert the seeded water-quality dataset

Default development stays unchanged:

- web stays mock by default
- API stays in-memory by default
- local Postgres is optional

## Local Smoke Database Defaults

The compose-backed smoke stack uses these local-only defaults:

```env
AQUAPULSE_WATER_QUALITY_SMOKE_DB_HOST=localhost
AQUAPULSE_WATER_QUALITY_SMOKE_DB_PORT=54329
AQUAPULSE_WATER_QUALITY_SMOKE_DB_NAME=aquapulse
AQUAPULSE_WATER_QUALITY_SMOKE_DB_USER=aquapulse
AQUAPULSE_WATER_QUALITY_SMOKE_DB_PASSWORD=change-me
AQUAPULSE_WATER_QUALITY_SMOKE_DB_SSL_MODE=disable
```

## Start The Local Postgres Container

This reuses the same lightweight local compose stack already used for alerts smoke testing:

```powershell
corepack pnpm water-quality:smoke:db:up
```

To stop it later:

```powershell
corepack pnpm water-quality:smoke:db:down
```

## Apply Migrations And Load The Seed

```powershell
corepack pnpm water-quality:smoke:db:prepare
```

That runs:

- the current schema migration
- the deterministic water-quality smoke seed

The seed includes:

- `3` pond-scoped readings for `pond-1`
- additional readings for `pond-2` and `pond-3`
- recent and older timestamps for sort verification
- stable IDs for list/detail verification
- one threshold-breach style reading
- one missing-critical-value style reading

## Run The API Against The Smoke Database

Set the API env so water-quality can use the Postgres adapter and report connectivity clearly:

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

## Run The Web App In Water-Quality-Only HTTP Mode

Set the web env:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE=mock
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_HTTP_TRANSPORT=proxy
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

Then run the web app:

```powershell
corepack pnpm --filter @aquapulse/web exec next dev
```

## Run The Bounded Verifier

For seeded read verification:

```powershell
$env:AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_BACKEND_ADAPTER='postgres'
$env:AQUAPULSE_WATER_QUALITY_VERIFY_EXPECT_SEEDED_SMOKE='true'
corepack pnpm water-quality:verify-runtime
```

That checks:

- backend diagnostics are reachable
- backend water-quality adapter is `postgres`
- pond-scoped list reads succeed through the local bridge
- the seeded latest reading `wq-smoke-pond-1-latest` is returned as the newest pond-1 row
- create and detail requests succeed through the same HTTP path

## What Success Looks Like

- `/runtime` shows:
  - backend reachable
  - backend water-quality adapter `postgres`
  - database connectivity `reachable` when boot healthcheck is enabled
  - water-quality cutover status `HTTP + Postgres water-quality cutover verified`
- the verifier reports:
  - seeded smoke dataset assertions passed
  - water-quality list, create, and detail requests succeeded

## What Still Remains Default And Safe

- the app does not switch globally to Postgres
- non-water-quality modules still default to mock/in-memory unless separately switched
- the smoke stack is opt-in and local-only
- alerts and AI behavior remain bounded by their existing runtime settings
