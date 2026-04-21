# Alerts Local Postgres Smoke Stack

This runbook adds the smallest practical local stack for exercising the real alerts HTTP/Postgres path.

## What It Gives You

- one local PostgreSQL container for alerts smoke testing
- one deterministic alerts seed dataset
- migration and seed scripts that do not change default repo runtime behavior
- a bounded verifier flow that can assert the seeded dataset and optionally run mutations

Default development stays unchanged:

- web stays mock by default
- API stays in-memory by default
- local Postgres is optional

## Local Smoke Database Defaults

The compose-backed smoke stack uses these local-only defaults:

```env
AQUAPULSE_ALERTS_SMOKE_DB_HOST=localhost
AQUAPULSE_ALERTS_SMOKE_DB_PORT=54329
AQUAPULSE_ALERTS_SMOKE_DB_NAME=aquapulse
AQUAPULSE_ALERTS_SMOKE_DB_USER=aquapulse
AQUAPULSE_ALERTS_SMOKE_DB_PASSWORD=change-me
AQUAPULSE_ALERTS_SMOKE_DB_SSL_MODE=disable
```

## Start The Local Postgres Container

```powershell
corepack pnpm alerts:smoke:db:up
```

To stop it later:

```powershell
corepack pnpm alerts:smoke:db:down
```

## Apply Migrations And Load The Seed

```powershell
corepack pnpm alerts:smoke:db:prepare
```

That runs:

- the current schema migration
- the deterministic alerts smoke seed

The seed includes:

- `4` alerts
- `open`, `acknowledged`, and `resolved` states
- assigned and unassigned alerts
- `unreviewed`, `under_review`, `reviewed`, and `deferred` review states
- note/history coverage
- a default saved view `alert-view-1`

## Run The API Against The Smoke Database

Set the API env so alerts can use the Postgres adapter and report connectivity clearly:

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

## Run The Web App In Alerts-Only HTTP Mode

Set the web env:

```env
NEXT_PUBLIC_AQUAPULSE_WEB_CLIENT_MODE=mock
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT=proxy
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

Then run the web app:

```powershell
corepack pnpm --filter @aquapulse/web exec next dev
```

## Run The Bounded Verifier

For seeded read verification:

```powershell
$env:AQUAPULSE_ALERTS_VERIFY_EXPECT_BACKEND_ADAPTER='postgres'
$env:AQUAPULSE_ALERTS_VERIFY_EXPECT_SEEDED_SMOKE='true'
corepack pnpm alerts:verify-runtime
```

For seeded read + mutation verification:

```powershell
$env:AQUAPULSE_ALERTS_VERIFY_EXPECT_BACKEND_ADAPTER='postgres'
$env:AQUAPULSE_ALERTS_VERIFY_EXPECT_SEEDED_SMOKE='true'
$env:AQUAPULSE_ALERTS_VERIFY_ENABLE_MUTATIONS='true'
corepack pnpm alerts:verify-runtime
```

## What Success Looks Like

- `/runtime` shows:
  - backend reachable
  - backend alerts adapter `postgres`
  - database connectivity `reachable` when boot healthcheck is enabled
  - alerts cutover status `HTTP + Postgres alerts cutover verified`
- the verifier reports:
  - seeded smoke dataset assertions passed
  - alerts list, summary, detail, saved views, and advisory explanation requests succeeded

## What Still Remains Default And Safe

- the app does not switch globally to Postgres
- non-alert modules still default to mock/in-memory
- the smoke stack is opt-in and local-only
- advisory AI explanations remain advisory-only
