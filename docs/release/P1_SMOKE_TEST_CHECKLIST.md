# P1 Smoke Test Checklist

## Local-Safe Smoke

1. Start API and web in normal local-safe mode.
2. Open dashboard, alerts, ponds, tasks, feed, and reports.
3. Confirm pages load and remain usable without Keycloak setup.
4. Confirm runtime diagnostics show local or bypass-safe state.
5. Submit one alert explanation feedback flow in local mode without requiring `aiResponseId` manually.

Expected result:

- local-safe remains broad
- no new authorization regressions appear
- frontend remains stable

## Active Keycloak Smoke

1. Start the stack with active Keycloak auth mode.
2. Use a bounded operator identity with a known pond-responsibility set.
3. Verify alerts list/detail/summary only show assigned alerts.
4. Verify tasks only show assigned tasks.
5. Verify ponds, batches, water-quality, and feed only show readable pond-linked records.
6. Verify attachment metadata only shows parent-readable records.
7. Verify out-of-scope detail reads return not found.
8. Verify water-quality and feed writes succeed only inside readable ponds.
9. Verify task and generic alert mutation flows respect current bounded visibility.
10. Generate an alert explanation, then submit feedback and confirm the normal flow includes `aiResponseId`.

Expected result:

- bounded HTTP read/write seams behave consistently
- AI feedback succeeds only with visible alert plus owned response linkage

## Negative Checks

1. Try reading an out-of-scope task, alert, pond, batch, water-quality record, feed entry, attachment, audit event, and AI history record directly by ID.
2. Try mutating an out-of-scope water-quality or feed record.
3. Try sending alert explanation feedback in active Keycloak mode without `aiResponseId`.

Expected result:

- out-of-scope detail returns not found
- unauthorized bounded creates return forbidden where applicable
- missing `aiResponseId` in active auth fails with validation-style error

## Live Updates Guard Check

1. Start the stack without `AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES`.
2. Inspect runtime diagnostics.
3. Confirm live updates report disabled.

Expected result:

- live updates remain off by default
- no websocket rollout occurs implicitly

## UAT Handoff

After smoke passes, run the longer walkthrough in:

- [Cross-Surface UAT Demo Script And Reviewer Checklist](../runbooks/uat-cross-surface-demo-script-and-reviewer-checklist.md)
