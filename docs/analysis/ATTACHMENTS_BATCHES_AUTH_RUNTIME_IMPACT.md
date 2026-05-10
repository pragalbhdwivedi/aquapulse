# Attachments Batches Auth Runtime Impact

## Summary

This pass adds backend authorization metadata to the existing attachments and batches controllers so the current bounded auth guards can enforce authenticated operator access.

## Runtime Impact

### Keycloak mode

Behavior changes only in Keycloak mode:

- unauthenticated requests to attachments routes now fail
- unauthenticated requests to batches routes now fail
- authenticated users without bounded operator access now fail

This closes the previously documented public backend exposure on these two surfaces.

### Local mode

No behavior regression is expected:

- local-safe development still hydrates the deterministic local operator
- the new route metadata is satisfied by that local operator session
- current frontend flows remain usable in local development

### Disabled mode

No behavior regression is expected:

- disabled auth mode still remains non-enforcing by design
- this branch does not change that runtime behavior

## Blast Radius

Low and bounded.

Touched surfaces:

- `apps/api/src/modules/attachments/attachments.controller.ts`
- `apps/api/src/modules/batches/batches.controller.ts`
- focused API auth contract tests
- analysis docs

Untouched surfaces:

- frontend routing
- auth service internals
- Keycloak verification flow
- websocket auth
- runtime diagnostics
- persistence schemas
- shared contracts
- attachment persistence behavior
- batch persistence behavior

## Migration Safety

None required.

This pass changes no schema and no stored data.

## Rollback Strategy

Rollback is narrow:

1. remove the auth decorators from the attachments controller routes
2. remove the auth decorators from the batches controller routes
3. revert the focused test and docs additions

No database rollback is required.

## Remaining Risk

The main remaining risk is broader repo coverage rather than this pass:

- some alerts routes are still only partially hardened
- ownership-aware access control is still not modeled
- runtime diagnostics remains auth-only rather than role-scoped

## Safe Next Hardening Seam

After attachments and batches, the safest bounded hardening seam is:

- remaining partial alerts backend routes

That next pass should keep using the current bounded `operator` role model unless a dedicated auth architecture session intentionally changes it.
