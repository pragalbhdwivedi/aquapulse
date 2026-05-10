# Active Keycloak Authorization Review

## Overall Assessment

Active Keycloak mode now has bounded enforcement across the main protected HTTP surfaces.

Estimated maturity: `88%`

## Strong Areas

- every major operational controller surface is route-protected
- most sensitive list/detail seams now return not found when out of scope
- pond-linked read/write seams consistently reuse pond responsibility
- AI feedback now requires both linked alert visibility and owned response linkage
- audit public mutation is no longer an operator capability in active auth

## Remaining Broad Areas

- pond mutations
- batch mutations
- attachment mutations
- saved-view ownership
- alerts live-updates visibility model
- generic AI placeholder create/update paths

## Highest Active-Auth Risk

The highest remaining active-auth risk is alerts live updates if enabled:

- websocket access is authenticated and operator-gated
- event payloads are not assignment-filtered
- emitted summary snapshots are generated without per-requester scope

This is acceptable for bounded internal release only if live updates stay disabled by default or are explicitly treated as a deferred broad surface.

## Secondary Active-Auth Risks

- shared saved views can expose query presets across operators
- broad pond/batch/attachment writes are still available to ordinary operators
- active-auth AI feedback now depends on durable response linkage being available from explanation persistence
