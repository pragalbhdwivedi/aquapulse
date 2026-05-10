# Alerts Auth Runtime Impact

## Summary

This pass closes the remaining partial backend exposure in the alerts HTTP controller by adding bounded operator auth metadata to four previously undecorated handlers.

## Runtime Impact

### Keycloak mode

Behavior changes only in Keycloak mode:

- unauthenticated requests to the newly hardened alerts routes now fail
- authenticated users without bounded operator access now fail

This brings the remaining partial alerts routes in line with the rest of the protected alerts controller surface.

### Local mode

No behavior regression is expected:

- local-safe development still hydrates the deterministic local operator
- the new route metadata is satisfied by that local operator session
- current alerts UI flows remain usable in local development

### Disabled mode

No behavior regression is expected:

- disabled auth mode still remains non-enforcing by design
- this branch does not change that runtime behavior

## Live-Updates Impact

None intended.

The following surface remains untouched:

- `GET /api/alerts/live-updates/session`
- websocket subscription authorization flow in `AlertsLiveUpdatesService`

This pass does not change websocket bootstrap, tickets, subscription auth state, or live fanout behavior.

## Blast Radius

Low and bounded.

Touched surfaces:

- `apps/api/src/modules/alerts/alerts.controller.ts`
- focused alerts route hardening contract tests
- analysis docs

Untouched surfaces:

- frontend alerts workbench behavior
- live-updates websocket seam
- auth service internals
- runtime diagnostics
- persistence
- shared contracts
- alert explanation AI behavior

## Migration Safety

None required.

This pass changes no schema and no stored data.

## Rollback Strategy

Rollback is narrow:

1. remove the auth decorators from the four newly hardened alerts handlers
2. revert the focused test and docs additions

No database rollback is required.

## Remaining Risk

The biggest remaining authorization risk is now outside the alerts controller hardening seam:

- ownership-aware restrictions are still not modeled
- diagnostics remains auth-only rather than role-scoped
- other modules may still need bounded hardening or ownership review

## Safe Next Hardening Seam

After alerts controller hardening, the safest next seam is:

- a bounded ownership and read-scope analysis pass for AI history, audit history, attachments, and batches

That should be analysis-first, because adding ownership enforcement would change current runtime behavior more than the decorator-only hardening passes did.
