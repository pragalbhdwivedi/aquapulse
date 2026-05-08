# AI Operator Assistance v1

This branch adds the first broader backend-controlled AI operator-assistance surfaces:

- daily farm summary via `POST /api/ai/ponds/summarize`
- shift handover via `POST /api/ai/handover/generate`
- dashboard assistant via `POST /api/ai/dashboard/query`
- incident rewrite via `POST /api/ai/text/rewrite`
- approval note draft via `POST /api/ai/approvals/draft-note`

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

Dashboard assistant uses bounded operational context such as:

- ponds needing attention
- recent water-quality risk signals
- open alerts
- pending tasks
- missing or stale update signals
- recent feed context when it helps answer a bounded operational question

Intended bounded question categories:

- `What needs attention first?`
- `Which ponds missed updates today?`
- `Which ponds have open critical alerts?`
- `Which pond had recent low DO / poor readings?`
- `Which tasks are still pending?`
- `Summarize important operational issues today.`

The assistant remains advisory-only and schema-driven. It does not become a general free-form chat surface in this branch.

Incident rewrite uses mostly user-provided text plus optional linked-record labels. It:

- rewrites rough operator wording into clearer operational English
- supports bounded tones such as `operator`, `formal`, `management`, and `audit`
- can return a fallback Hindi draft when bilingual output is requested
- stays factual and advisory-only

Approval note draft uses bounded linked-record context when available, such as:

- linked alert or task identity
- current status and severity
- short recent note/timeline fragments
- short user prompt notes

It remains advisory-only and does not approve, close, or mutate any record directly.

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
- open the dashboard page and confirm the bounded dashboard assistant answer renders
- open the reports page and confirm daily summary plus shift handover render
- confirm the reports page now shows incident rewrite plus approval note draft cards
- open runtime diagnostics and confirm operator assistance shows `fallback` unless provider config is present

## Intentionally deferred

Still deferred for later AI branches:

- incident drafting expansion
- broader AI chat
- any AI-driven critical write authority
