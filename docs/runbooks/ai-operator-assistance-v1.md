# AI Operator Assistance v1

This branch adds the first broader backend-controlled AI operator-assistance surfaces:

- daily farm summary via `POST /api/ai/ponds/summarize`
- shift handover via `POST /api/ai/handover/generate`
- dashboard assistant via `POST /api/ai/dashboard/query`
- incident rewrite via `POST /api/ai/text/rewrite`
- incident draft via `POST /api/ai/incidents/draft`
- approval note draft via `POST /api/ai/approvals/draft-note`

It also keeps the older alert explanation surface aligned with the same bounded output discipline:

- alert explanation via `POST /api/ai/alerts/explain`
- AI usage history and review via the existing `GET /api/ai` log seam

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

## Output alignment

The bounded AI surfaces now share a compact output discipline where practical:

- optional `outputMode` values such as `english_only` and `bilingual`
- bounded tone values such as `operator`, `formal`, `management`, and `audit`
- backend-owned output metadata describing fallback vs provider mode plus effective output settings

Alert explanation now separates:

- observed facts
- likely factors
- immediate checks
- escalation considerations
- missing-information notes when context is weak

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

Incident draft uses bounded supplied context such as:

- raw operator notes
- linked alert, task, or pond identifiers when available
- severity or urgency hints when supplied
- short recent linked-record context when available

It:

- turns rough operator notes into a clearer incident draft for review
- preserves factual meaning instead of inventing measurements or approvals
- supports bounded bilingual output and bounded tone modes
- remains advisory-only and does not create or mutate any critical record directly

Alert explanation uses bounded alert context such as:

- alert severity, source, status, and review state
- latest note when available
- short recent history summary

It remains advisory-only and does not acknowledge, resolve, assign, or mutate alerts.

## Runtime diagnostics

Backend runtime diagnostics now expose `aiOperatorAssistance` with:

- whether operator assistance is enabled
- fallback vs provider-backed mode
- whether provider config is complete
- supported tasks
- supported bilingual/tone capabilities
- safe degraded warnings

Backend runtime diagnostics also expose `aiExplanations` with:

- fallback vs provider-backed status
- whether bilingual output is supported
- whether bounded tone shaping is supported

Backend runtime diagnostics now also expose `aiHistory` with:

- whether AI usage history is enabled
- confirmation that history is sourced from the existing request/response log seam
- whether provider/fallback metadata is available on history items
- which bounded filter fields are supported

## Local verification

Recommended checks:

- `corepack pnpm typecheck`
- `corepack pnpm test:contracts`
- open the dashboard page and confirm the bounded dashboard assistant answer renders
- open the reports page and confirm daily summary plus shift handover render
- confirm the reports page now shows incident rewrite plus approval note draft cards
- confirm the reports page now also shows the incident draft card
- confirm the reports page now also shows recent AI usage history with task type and fallback/provider labels
- confirm eligible history items offer a bounded `Reuse` link that prefills rewrite/draft cards without auto-submitting
- confirm reused rewrite/draft cards expose a bounded `Compare current vs reused draft` action and a review-only diff panel
- open the alerts workbench and confirm the explanation card shows observed facts, likely factors, immediate checks, and escalation considerations
- open runtime diagnostics and confirm operator assistance shows `fallback` unless provider config is present

## AI history review

The bounded AI history view shows:

- recent generated outputs from the existing request/response log seam
- task type labels such as summary, handover, dashboard assistant, rewrite, incident draft, approval note draft, and alert explanation
- provider-backed vs fallback metadata when available
- request timestamps, model labels, and related record identifiers when available
- copy-ready raw output text for bounded operator reuse

The bounded reuse-from-history helper currently supports only the smallest safe mappings:

- incident rewrite history -> incident rewrite prefill
- incident draft history -> incident draft prefill
- approval note draft history -> approval note draft prefill

The bounded compare-from-history helper supports the same destinations:

- incident rewrite history -> incident rewrite compare
- incident draft history -> incident draft compare
- approval note draft history -> approval note draft compare

The helper stays user-controlled:

- operators must explicitly click a `Reuse` link from history
- the destination card is only prefilled, never auto-submitted
- the prefilled text stays editable before any new generation request
- no historical output is auto-applied into a live operational record
- compare mode must be explicitly triggered after reuse
- compare mode never auto-merges or replaces the current draft

It does not:

- create approvals
- mutate alerts or tasks
- become a general AI chat history surface
- expose provider secrets or raw tokens

## Intentionally deferred

Still deferred for later AI branches:

- broader AI chat
- treatment recommendation logic
- any AI-driven critical write authority
- full AI analytics or reinforcement dashboards
- automatic reuse into saved operational records
- automatic merge or replace actions from compare mode
