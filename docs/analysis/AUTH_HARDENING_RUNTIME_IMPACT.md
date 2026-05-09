# Auth Hardening Runtime Impact

## Summary

This pass is intentionally small. It adds backend authorization metadata to the existing AI and audit controllers so the current auth guards can enforce the already-supported bounded operator access model.

## Runtime Impact

### Keycloak mode

Behavior changes only in Keycloak mode:

- unauthenticated requests to AI routes now fail
- unauthenticated requests to audit routes now fail
- authenticated users without bounded operator access now fail

This closes the previously documented public backend exposure on these two surfaces.

### Local mode

No behavior regression is expected:

- local-safe development still hydrates the deterministic local operator
- the new route metadata is satisfied by the local operator session
- frontend flows remain usable in local development

### Disabled mode

No behavior regression is expected:

- the existing auth service continues to treat disabled mode as non-enforcing
- this branch does not change that runtime behavior

## Blast Radius

Low and bounded.

Touched surfaces:

- `apps/api/src/modules/ai/ai.controller.ts`
- `apps/api/src/modules/audit/audit.controller.ts`
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
- AI runtime behavior

## Migration Safety

None required.

This pass changes no schema and no stored data.

## Rollback Strategy

Rollback is narrow:

1. remove the auth decorators from the AI controller routes
2. remove the auth decorators from the audit controller routes
3. revert the focused test and docs additions

No database rollback is required.

## Remaining Risk

The main remaining risk is not this hardening itself, but the broader repo state:

- other modules still have partial or missing backend authorization
- ownership-aware access rules are still not modeled
- diagnostics remains auth-only rather than role-scoped

## Safe Next Hardening Seam

After AI and audit, the safest next bounded hardening seam is:

- attachments and batches backend route protection

After that:

- remaining partial alerts routes

Those seams should still avoid auth redesign and should keep using the existing bounded `operator` role model unless a separate architecture session changes that intentionally.
