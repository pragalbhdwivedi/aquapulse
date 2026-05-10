# P1 Internal RC1 UAT Feedback Tracker

## Scope Reminder

This tracker is for `p1-internal-rc1-authz-bounded` only.

Important reviewer reminders:

- this is not a production release
- live updates are disabled by default
- live updates are not assignment-scoped yet
- saved-view ownership is deferred
- attachment file-content or download routes are not implemented
- reviewer/admin override models are deferred
- production deployment automation is deferred
- AI feedback requires `aiResponseId` in active Keycloak mode
- local-safe behavior is intentionally broader than active Keycloak behavior

## How To Use This Tracker

1. Add one row per issue, question, or notable observation.
2. Use `bug`, `authorization`, `UI/UX`, `docs`, `deferred-boundary confusion`, `performance`, or `test gap` as the feedback type.
3. Record whether the issue happened in `local-safe` or `active Keycloak`.
4. For expected deferred-boundary behavior, log it as `note` or `deferred-boundary confusion` rather than as a product bug unless the docs were misleading.
5. Link supporting screenshots, logs, or runtime diagnostics where possible.

## Master Tracker Table

| Feedback ID | Date | Reviewer | Area | Environment | Mode | Severity | Type | Summary | Steps to reproduce | Expected behavior | Actual behavior | Evidence / screenshot / logs | Suggested fix | Owner | Status | Target branch | Target RC | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RC1-UAT-001 | YYYY-MM-DD | name | alerts / ponds / tasks / feed / AI / audit / docs / runtime | local / shared / staging-like | local-safe / active Keycloak | blocker / high / medium / low / note | bug / authorization / UI/UX / docs / deferred-boundary confusion / performance / test gap |  |  |  |  |  |  |  | open / triaged / fixed / deferred / closed | branch-name | rc1 / later |  |

## Severity Guide

- `blocker`: RC cannot proceed for bounded internal review
- `high`: major workflow break or authorization concern
- `medium`: meaningful defect or confusing behavior with workaround
- `low`: minor polish issue
- `note`: observation, question, or expected deferred-boundary reminder

## Status Guide

- `open`
- `triaged`
- `fixed`
- `deferred`
- `closed`

## Area Suggestions

- alerts
- ponds
- batches
- water-quality
- feed
- tasks
- attachments
- AI
- audit
- runtime diagnostics
- release docs

## Review Prompts

- Was the behavior different between local-safe and active Keycloak?
- Was the issue a real regression, or an expected deferred boundary?
- Did runtime diagnostics help explain the behavior clearly?
- If active Keycloak was used, was `aiResponseId` present through the normal explain-to-feedback flow?
