# Parent Resource Scope Resolver Runtime Impact

## Runtime impact

This pass adds only a new internal authorization foundation module and tests.

Affected seams:

- new internal parent-resource scope resolver service
- new resource-scope module wiring

Unaffected seams:

- attachment list/detail behavior
- attachment file-content behavior
- frontend routes and rendering
- public API response shapes
- database schema
- existing scoped read behavior across other modules

## Local-safe compatibility

Local-safe remains broad.

The new resolver explicitly returns `defer_local_safe_allow` in local mode so future attachment enforcement can preserve current development and demo behavior.

## Authorization behavior

No live authorization behavior changed in this pass.

The resolver only delegates to already-existing scoped detail seams and returns an internal decision. It is not yet used by attachment routes.

## Blast radius

Blast radius is intentionally small because:

- no current controller or repository behavior changed
- no database or contract changes were made
- the new logic is isolated behind an internal service boundary

## Remaining gaps

- attachment metadata list/detail still remain broad
- attachment file-content access is still unscoped
- unsupported parent resource types still need an enforcement policy once attachment scoping is wired
- parent-resource mutation authorization is still out of scope
