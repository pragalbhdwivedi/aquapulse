# Tasks Local Postgres Smoke Stack

This is the smallest local Postgres smoke path for the tasks domain. It reuses the shared local smoke Postgres container and keeps default AquaPulse runtime behavior unchanged unless you explicitly enable the tasks cutover.

## What stays default

- web runtime stays mock-backed by default
- API persistence stays in-memory by default
- local Postgres is optional and only for bounded verification

## Start the local smoke Postgres

```bash
corepack pnpm tasks:smoke:db:up
```

This reuses `infra/local/alerts-smoke.compose.yaml` and exposes Postgres on `localhost:54329`.

## Apply schema and seed the tasks smoke dataset

```bash
corepack pnpm tasks:smoke:db:prepare
```

That applies the core schema and loads a tiny deterministic tasks dataset.

## Smoke dataset shape

The seed includes:

- multiple tasks
- different statuses: `todo`, `in_progress`, `done`, `cancelled`
- different assignees
- pond-linked tasks for `pond-1` and `pond-2`
- one unlinked task for null-pond behavior
- stable IDs such as `task-1`

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

## Run the web app in tasks-only HTTP mode

```bash
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_HTTP_TRANSPORT=proxy
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

## Verify the smoke path

```bash
AQUAPULSE_TASKS_VERIFY_EXPECT_BACKEND_ADAPTER=postgres
AQUAPULSE_TASKS_VERIFY_EXPECT_SEEDED_SMOKE=true
corepack pnpm tasks:verify-runtime
```

The verifier checks:

- backend tasks adapter visibility
- tasks list through the local bridge
- seeded detail read for `task-1`
- create through HTTP
- update through HTTP
- deterministic seeded smoke expectations for `pond-1`

## Shut down the local smoke Postgres

```bash
corepack pnpm tasks:smoke:db:down
```
