# P1 Release Readiness Checklist

## Build And Contract Verification

- [x] `corepack pnpm --filter @aquapulse/api typecheck`
- [x] `corepack pnpm --filter @aquapulse/web typecheck`
- [x] `corepack pnpm test:contracts`

## Authorization Guardrails

- [x] AI routes protected
- [x] audit routes protected
- [x] alerts routes protected
- [x] attachments routes protected
- [x] batches routes protected
- [x] ponds, tasks, feed, water-quality routes protected
- [x] AI history scoped by `requestedBy`
- [x] audit history scoped by `actor_id`
- [x] tasks scoped by `assigneeId`
- [x] alerts scoped by `assignedTo`
- [x] ponds, batches, water-quality, and feed scoped by pond responsibility
- [x] attachment metadata scoped by parent-resource visibility
- [x] audit mutation restricted in active auth
- [x] task and generic alert mutations bounded
- [x] AI feedback requires linked alert visibility and owned `aiResponseId` in active Keycloak mode

## Release Guardrails

- [x] live updates disabled by default
- [x] explicit backend flag required to enable live updates
- [x] local-safe remains broad
- [x] no new reviewer/admin override assumptions
- [x] no saved-view ownership claim
- [x] no attachment file-download claim

## Known Deferred Boundaries Acknowledged

- [x] saved-view ownership
- [x] live-updates assignment scoping
- [x] attachment file-content authorization if later added
- [x] pond write authority refinement
- [x] batch write authority refinement
- [x] attachment write authority refinement
- [x] supervisor/admin override model
- [x] reviewer/admin AI feedback workflow
- [x] compliance export and audit self-auditing

## Release Blockers

No blocker was found for bounded internal release.

## Release Conditions

The release decision stays valid only if:

- `AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES` is not enabled by default
- reviewers treat deferred surfaces as deferred
- active-auth testing includes at least one Keycloak-bounded pass
