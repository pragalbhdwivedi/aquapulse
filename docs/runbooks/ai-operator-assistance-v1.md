# AI Operator Assistance v1

This branch adds the first broader backend-controlled AI operator-assistance surfaces:

- daily farm summary via `POST /api/ai/ponds/summarize`
- shift handover via `POST /api/ai/handover/generate`

Both flows are advisory-only. They do not:

- close alerts
- approve treatments
- post inventory
- edit thresholds
- change finance records
- mutate any other critical farm record directly

## How it works

The web UI triggers the route, then the API:

- builds bounded read-only context from ponds, water-quality, feed, tasks, and open alerts
- optionally calls the provider-backed Responses path when configured
- validates the structured JSON output
- logs request and response metadata through the AI repository seam
- falls back safely to deterministic operator-assistance output when provider config is missing or unavailable

## Local behavior

Default local development stays safe:

- no OpenAI key is required
- fallback mode remains available by default
- mock and in-memory development flows still work
- outputs remain schema-driven and backend-controlled

Optional provider-backed mode:

- set `AQUAPULSE_AI_OPERATOR_ASSISTANCE_MODE=openai`
- set `OPENAI_API_KEY`
- optionally set `OPENAI_BASE_URL`
- optionally set `OPENAI_OPERATOR_ASSISTANCE_MODEL`

If provider mode is requested but config is incomplete, AquaPulse stays on deterministic fallback and surfaces a runtime warning.

## Data used

Daily farm summary uses bounded snapshots such as:

- active ponds
- recent water-quality readings
- open alerts
- recent feed entries
- pending tasks
- simple missing-data signals

Shift handover uses bounded shift/day-window context such as:

- recent feed and water-quality activity
- open alerts
- pending tasks
- ponds needing attention
- watch items for the next shift

## Runtime diagnostics

Backend runtime diagnostics now expose `aiOperatorAssistance` with:

- whether operator assistance is enabled
- fallback vs provider-backed mode
- whether provider config is complete
- supported tasks
- safe degraded warnings

## Local verification

Recommended checks:

- `corepack pnpm typecheck`
- `corepack pnpm test:contracts`
- open the reports page and confirm daily summary plus shift handover render
- open runtime diagnostics and confirm operator assistance shows `fallback` unless provider config is present

## Intentionally deferred

Still deferred for later AI branches:

- dashboard assistant / Q&A
- incident drafting expansion
- approval-note drafting
- broader AI chat
- any AI-driven critical write authority
