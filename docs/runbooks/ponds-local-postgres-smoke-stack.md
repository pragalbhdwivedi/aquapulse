# Ponds Local Postgres Smoke Stack

This is the smallest local Postgres smoke path for the ponds domain. It reuses the shared local smoke Postgres container and keeps default AquaPulse runtime behavior unchanged unless you explicitly enable the ponds cutover.

## What stays default

- web runtime stays mock-backed by default
- API persistence stays in-memory by default
- local Postgres is optional and only for bounded verification

## Start the local smoke Postgres

```bash
corepack pnpm ponds:smoke:db:up
```

This reuses `infra/local/alerts-smoke.compose.yaml` and exposes Postgres on `localhost:54329`.

## Apply schema and seed the ponds smoke dataset

```bash
corepack pnpm ponds:smoke:db:prepare
```

That applies the core schema and loads a tiny deterministic ponds dataset.

## Smoke dataset shape

The seed includes:

- multiple ponds
- different statuses: `active`, `maintenance`, `inactive`
- different kinds: `pond`, `tank`, `cage`
- stable IDs such as `pond-1`
- stable names and farm links for list/detail verification
- values that remain compatible with pond-linked domains already modeled

## Run the API in Postgres mode

Example local env:

```bash
AQUAPULSE_PERSISTENCE_MODE=postgres
AQUAPULSE_ENABLE_POSTGRES_ADAPTERS=true
DATABASE_HOST=localhost
DATABASE_PORT=54329
DATABASE_NAME=aquapulse
DATABASE_USER=aquapulse
DATABASE_PASSWORD=change-me
DATABASE_SSL_MODE=disable
```

Then start the API on its normal local port.

## Run the web app in ponds-only HTTP mode

```bash
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT=proxy
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

## Verify the smoke path

```bash
AQUAPULSE_PONDS_VERIFY_EXPECT_BACKEND_ADAPTER=postgres
AQUAPULSE_PONDS_VERIFY_EXPECT_SEEDED_SMOKE=true
corepack pnpm ponds:verify-runtime
```

The verifier checks:

- backend ponds adapter visibility
- ponds list through the local bridge
- seeded detail read for `pond-1`
- deterministic seeded smoke expectations for the bounded dataset

## Shut down the local smoke Postgres

```bash
corepack pnpm ponds:smoke:db:down
```
