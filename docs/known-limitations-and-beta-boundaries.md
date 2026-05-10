# Known Limitations And Beta Boundaries

This summary is intentionally concise. It is meant to help internal reviewers understand what AquaPulse supports today and where manual review or bounded fallback behavior still applies.

## What AquaPulse Supports Today

- Core operational workflows across alerts, ponds, water-quality, tasks, and feed.
- Bounded protected reads and bounded protected operator actions on selected surfaces.
- Bounded AI assistance for explanation, summary, handover, drafting, review, history, reuse, and compare.
- Runtime diagnostics that explain fallback, degraded, protected, and local-safe states.

## What Remains Advisory-Only

- All AI-generated output.
- AI explanations, summaries, drafts, rewrites, and assistant answers.
- AI reuse and compare helpers.

AI can help operators review or draft content, but it does not directly change critical records.

## What Still Requires Manual Operator Review

- Alert lifecycle decisions
- Assignment and review-state changes
- Pond updates
- Water-quality create/update actions
- Task create/update actions
- Feed create/update actions
- Any use of AI-generated text before it is copied into an operational workflow

## What Fallback And Local-Safe Behavior Mean

- `fallback` means AquaPulse is intentionally using a safe bounded path instead of pretending a provider-backed or protected path succeeded.
- `degraded` means a surface is operating in a limited but intentional state.
- `disabled/local bypass` means local development and demos can stay usable without forcing full auth or live providers.
- `auth-required` or `protected` means the bounded backend surface exists, but the current forwarded auth/session state is not sufficient.

## What Is Not Production-Hardened Yet

- Full production SSO hardening and end-user auth flows
- Repo-wide RBAC and full-domain auth enforcement
- Broader observability and analytics
- General AI chat or autonomous AI workflows
- Broader live-update expansion beyond the current default-off alerts work

Specific current boundaries:

- alerts live updates are disabled by default and are not assignment-scoped yet
- saved views are route-protected but not owner-scoped
- attachment file-content or download authorization does not exist yet
- supervisor/admin override models do not exist yet
- reviewer/admin AI feedback workflows do not exist yet
- active Keycloak alert explanation feedback requires `aiResponseId`

## Intentionally Deferred

- Automatic record mutation from AI output
- Automatic approval, close, or escalation actions
- Full production rollout hardening across every domain surface
- Large-scale workflow automation

## Recommended Internal Framing

- Treat the current release as a bounded internal rollout candidate.
- Treat AI as advisory-only and review-first.
- Treat diagnostics and degraded-state messaging as part of the trust story, not as a failure story.
