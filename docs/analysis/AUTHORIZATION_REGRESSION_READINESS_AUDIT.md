# Authorization Regression & Release Readiness Audit

## Verdict

AquaPulse's bounded authorization layer is materially stronger and internally consistent across the main HTTP read and write seams. I did not find a direct regression where a previously hardened list/detail or mutation seam was silently reopened.

Recommended release stance:

- ready for a bounded internal release
- with explicit caveats
- keep alerts live updates disabled by default
- keep saved-view ownership deferred and documented
- do not market pond/batch/attachment write authority as finalized

## Maturity Snapshot

- overall authorization maturity: `84%`
- active Keycloak authorization maturity: `88%`
- local-safe compatibility maturity: `96%`

## What Is Fully Protected

- route protection for AI, audit, alerts, attachments, batches, ponds, tasks, feed, water-quality, and diagnostics
- AI history reads by `requestedBy`
- audit history reads by `actor_id`
- task list/detail reads by `assigneeId`
- alert list/detail/summary plus triage actions by `assignedTo`
- pond list/detail reads by pond responsibility
- batch list/detail reads by pond responsibility
- water-quality list/detail reads by pond responsibility
- feed list/detail reads by pond responsibility
- attachment metadata list/detail reads by parent-resource visibility
- water-quality create/update by pond responsibility
- feed create/update by pond responsibility
- task create/update by assignment visibility plus pond responsibility where applicable
- generic alert create/update by assignment visibility plus pond responsibility where applicable
- audit public mutation blocked in active Keycloak mode
- AI feedback in active Keycloak mode now requires both linked alert visibility and owned `aiResponseId`

## What Is Only Partially Protected

- alert saved views are route-protected but not owner-scoped
- alert live updates are authenticated/ticketed but not assignment-scoped
- pond writes remain operator-protected but not responsibility-scoped
- batch writes remain operator-protected but not pond-scoped
- attachment writes remain operator-protected but not parent-resource-scoped
- generic AI create/update placeholder routes remain operator-protected but not ownership-scoped

## Intentionally Deferred

- saved-view ownership
- live-updates per-alert visibility filtering
- attachment file-content authorization
- pond write authority model
- batch write authority model
- attachment write authority model
- supervisor/admin overrides
- reviewer/admin AI feedback workflows

## Regression Findings

No hard authorization regression was found in the already-bounded HTTP read/write seams.

The main release caveat is not a regression but an intentionally deferred bypass surface:

- alerts live updates still broadcast broad alert event summaries once a websocket subscription is accepted
- the websocket path is gated by authenticated operator access, but not by assignment visibility
- because the feature is disabled by default, this is only release-safe if that default remains unchanged for the bounded internal release

## Release Call

Bounded internal release is reasonable now if all of the following stay true:

- current local-safe defaults remain unchanged
- alerts live updates stay disabled unless separately hardened
- deferred surfaces are documented as deferred, not finished
- no one treats saved views or pond/batch/attachment writes as fully scoped features yet
