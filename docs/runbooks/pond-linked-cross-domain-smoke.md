# Pond-Linked Cross-Domain Smoke

This runbook is the bounded cross-domain smoke path centered on ponds. It keeps the local workflow small while proving that pond-linked reads across ponds, water-quality, feed, tasks, and alerts stay coherent against one known-good Postgres dataset.

## What stays default

- web runtime stays mock-backed by default
- API persistence stays in-memory by default
- local Postgres remains optional and verifier-only

## Prepare the shared pond-linked smoke dataset

Start the shared smoke Postgres if it is not already running:

```bash
corepack pnpm ponds:smoke:db:up
```

Load the bounded cross-domain dataset:

```bash
corepack pnpm ponds:smoke:db:prepare:linked
```

This writes one deterministic dataset containing:

- `4` seeded ponds
- pond-linked water-quality rows for `pond-1`, `pond-2`, and `pond-3`
- pond-linked feed rows for `pond-1` and `pond-2`
- pond-linked tasks for `pond-1` and `pond-2`
- alert references for `pond-1` and `pond-2`

## Run the API and web app

Run the API in Postgres mode and the web app with the domain-specific HTTP modes you want to verify. For a full cross-domain pass, enable:

```bash
NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP=true
NEXT_PUBLIC_AQUAPULSE_WEB_PONDS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_WATER_QUALITY_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_FEED_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_TASKS_MODE=http
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE=http
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
```

## Run the cross-domain verifier

```bash
AQUAPULSE_POND_LINKED_VERIFY_EXPECT_BACKEND_ADAPTER=postgres
AQUAPULSE_POND_LINKED_VERIFY_EXPECT_SEEDED_SMOKE=true
corepack pnpm ponds:verify-linked-smoke
```

The verifier checks:

- ponds seeded list/detail reads
- water-quality rows pointing to known seeded ponds
- feed rows pointing to known seeded ponds
- tasks pointing to known seeded ponds
- alert references staying structurally aligned with seeded ponds

## Single-domain verifiers you can still run

After loading the same linked smoke dataset, these remain useful:

- `corepack pnpm ponds:verify-runtime`
- `corepack pnpm water-quality:verify-runtime`
- `corepack pnpm feed:verify-runtime`
- `corepack pnpm tasks:verify-runtime`
- `corepack pnpm alerts:verify-runtime`

## What stays intentionally out of scope

- no global runtime cutover
- no new UI behavior
- no new auth requirements
- no websocket changes
- no broader integration harness beyond bounded smoke verification
