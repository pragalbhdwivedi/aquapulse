# Cross-Surface UAT Demo Script And Reviewer Checklist

This runbook ties together the bounded polish already added across dashboard, alerts, ponds, tasks, feed, reports, and runtime diagnostics. It does not change runtime, auth, AI, or platform behavior.

## Audience

- Internal operator walkthroughs
- Stakeholder demos
- UAT reviewers
- Technical reviewers who need to understand fallback and protected-state behavior

## Demo Story

Tell one simple story:

1. Start at the dashboard to show overall farm awareness.
2. Move to alerts to show triage and protected/manual operator actions.
3. Move to ponds to show a single operational workflow with overview, recent readings, latest detail, and manual updates.
4. Move to tasks to show pending work and follow-up clarity.
5. Move to feed to show recent operational history and manual corrections/additions.
6. Move to reports to show advisory-only AI generation, history, reuse, and compare.
7. Open runtime diagnostics only if the audience needs the technical explanation for fallback, protected reads, or local-safe mode.

## What To Show On Each Page

### Dashboard

- Show the high-level counts and “what needs attention first” framing.
- Emphasize that this page is the entry point for the rest of the walkthrough.

### Alerts Workbench

- Show the quick triage summary first.
- Open one alert and walk through:
  - alert snapshot
  - operator triage
  - advisory explanation
  - action history
- Emphasize that AI explanation is advisory-only and that protected/manual actions remain explicit.

### Pond Detail

- Show the pond workflow overview card first.
- Then show:
  - pond overview
  - recent water-quality history
  - latest water-quality detail
  - manual pond and water-quality actions
- Emphasize the difference between preview, full protected detail, and degraded safe fallback.

### Tasks

- Start with the pending work list.
- Open the selected task detail and call out status, assignee, and pond link.
- Then show the manual create/update task actions.

### Feed

- Start with recent feed history.
- Open the selected feed detail and call out quantity, pond link, time, and batch.
- Then show the manual create/update feed actions.

### Reports / AI Surfaces

- Walk through generate -> review -> reuse -> compare.
- Use one or two examples only:
  - incident rewrite
  - incident draft
  - approval note draft
- Emphasize that generated content is advisory-only, review-first, and never auto-applied.

### Runtime Diagnostics

- Use only for technical audiences or when someone asks why a surface is blocked, bypassed, or degraded.
- Start with the “Quick Read” block before opening the detailed lines.

## What Fallback / Protected / Advisory States Mean

- `advisory-only`:
  AI output helps an operator review or draft content, but it does not change operational records by itself.
- `protected` or `auth-required`:
  The bounded backend surface exists, but current auth/session/forwarding is not sufficient for the action or read.
- `degraded`:
  AquaPulse is intentionally staying on a safe limited path instead of pretending the protected path worked.
- `disabled/local bypass`:
  The local-safe mode is intentionally allowing bounded development/demo use without forcing full auth.

## What Not To Overexplain In A Live Demo

- Do not enumerate every protected slice label unless the audience is technical.
- Do not deep-dive into all diagnostics lines unless someone asks.
- Do not treat fallback mode as a failure; explain it as intentional safe behavior.
- Do not imply AI can save, approve, close, or mutate records automatically.

## Reviewer Checklist

### Dashboard / Overview

- Is the first page understandable without extra explanation?
- Is it clear what needs attention first?

### Alerts / Triage

- Is the queue readable?
- Is the next operator action obvious?
- Are protected/auth-limited states understandable?

### Pond Workflow

- Is the difference between overview, recent history, latest detail, and manual actions clear?
- Is it obvious when the page is showing preview vs full protected detail?

### Tasks Workflow

- Is the pending-work story clear?
- Is it obvious when to create a new follow-up task versus update the current one?

### Feed Workflow

- Is the recent-history story clear?
- Is it obvious when to create a new feed record versus update the current one?

### Reports / AI Workflow

- Are generated outputs understandable?
- Is advisory-only behavior obvious?
- Are history, reuse, and compare clearly review-only rather than automatic workflow?

### Diagnostics / Technical Review

- Is the “Quick Read” summary understandable before the detailed lines?
- Can a reviewer explain fallback, protected, and local-safe behavior after reading it?

## Local Demo Mode

- AquaPulse remains demo-safe in local/mock mode.
- Live OpenAI and live Postgres are not required for a bounded walkthrough.
- If a protected path is unavailable, the UI should explain whether the result is blocked, bypassed, or degraded rather than failing silently.

## Still Intentionally Beta / Internal

- AI remains advisory-only and review-first.
- Protected reads and mutations still depend on the existing bounded forwarding/session model when auth mode is active.
- Runtime diagnostics still favor clarity and completeness over a polished observability product.
