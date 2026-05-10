# Attachment Scope Runtime Impact

## Runtime impact

This pass changes only attachment metadata read behavior in active authenticated mode.

Affected backend seams:

- attachment controller read path
- attachment application-service read path
- parent-resource resolver consumption

Unaffected seams:

- attachment create/update
- file-content or download behavior
- storage behavior
- frontend response shapes
- existing parent-resource scope rules

## Local-safe compatibility

Local-safe is preserved intentionally.

The new attachment read enforcement accepts the resolver's `defer_local_safe_allow` decision so demo and development flows remain broad.

## Unknown and unsupported parents

Unsupported or unknown parent resource types are hidden from active-auth operators.

That means:

- list reads filter them out
- detail reads return not found

## Blast radius

Blast radius is limited because:

- only attachment metadata list and detail changed
- no parent scope rules were modified
- no storage or upload behavior changed

## Remaining gaps

- file-content access is still a follow-up seam
- attachment write scoping is still deferred
- supervisor/admin override behavior is still deferred
