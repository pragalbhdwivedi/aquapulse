# Alert Scope Runtime Impact

## Runtime Impact

- In Keycloak mode, alert list, detail, and summary reads are now assignment-scoped.
- In local and disabled modes, the existing broad queue behavior remains unchanged.
- No API response shapes changed.
- No frontend routes or frontend query calls changed.

## Local-Safe Compatibility

- Preserved by design.
- In-memory and mock flows continue to expose the broad shared queue in local-safe mode.
- Demo and UAT flows that rely on shared visibility remain intact outside active authenticated mode.

## Stability Notes

- Detail protection uses the same repository filtering model as list reads.
- Summary protection uses the same `assignedTo` filter as list reads.
- Live-update summary snapshots remain broad because the websocket seam was intentionally left untouched in this branch.

## Remaining Gaps

- no supervisor/admin override visibility
- no pond-based alert visibility
- no scoped saved-view ownership
- no websocket per-user scope
