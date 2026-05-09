# Ponds Local HTTP Cutover

This runbook explains the ponds-only opt-in HTTP path. AquaPulse still defaults to mock and in-memory runtime unless you explicitly enable the ponds cutover.

For a known-good local Postgres dataset, use
`docs/runbooks/ponds-local-postgres-smoke-stack.md` alongside this runbook.

## Default behavior

- The web app stays mock-backed by default.
- The API keeps using in-memory adapters by default.
- Nothing in this runbook changes the global runtime for other modules.

## Enable ponds-only HTTP mode in web

Set these env vars before starting `apps/web`:

```bash
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT=proxy
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

If you prefer direct transport instead of the local bridge:

```bash
NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_TRANSPORT=direct
NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_HTTP_BASE_URL=http://localhost:4000
```

## Backend expectations

Start `apps/api` with the existing ponds Postgres adapter configuration enabled if you want a true HTTP plus Postgres cutover. The `/runtime` page and `/api/diagnostics/runtime` will show whether ponds is really using `in-memory` or `postgres`.

## Local bridge path

When transport is `proxy`, the web app sends ponds requests through:

- `/api/ponds`

The Next.js bridge forwards those requests to the backend target from `AQUAPULSE_WEB_LOCAL_API_BACKEND_URL`.

## Verify the cutover

Run the web app and API, then execute:

```bash
corepack pnpm ponds:verify-runtime
```

Useful verifier env vars:

```bash
AQUAPULSE_PONDS_VERIFY_WEB_BASE_URL=http://localhost:3000
AQUAPULSE_PONDS_VERIFY_API_BASE_URL=http://localhost:4000
AQUAPULSE_PONDS_VERIFY_EXPECT_BACKEND_ADAPTER=postgres
AQUAPULSE_PONDS_VERIFY_POND_ID=pond-1
AQUAPULSE_PONDS_VERIFY_EXPECT_SEEDED_SMOKE=false
```

The verifier checks:

- backend runtime diagnostics
- ponds list through the web bridge
- pond detail through the web bridge

## What remains default

- global web runtime: mock
- API persistence default: in-memory
- alerts, water-quality, feed, and tasks modes: unchanged unless separately enabled
