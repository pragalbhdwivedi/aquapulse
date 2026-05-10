# AI Response Linkage Frontend Runtime Impact

## Runtime Impact

Blast radius is very small.

Touched runtime path:

- alerts workbench explanation feedback submission

Untouched runtime paths:

- explanation generation UI
- feedback UI rendering
- alert lifecycle actions
- alert triage actions
- local-safe/demo behavior
- unrelated report or review flows

## Behavior Change Summary

Before:

- frontend relied on nested explanation payload compatibility only

After:

- frontend still sends the full explanation payload
- frontend now also sends top-level `aiResponseId` when available

## Frontend UX Impact

None by design.

Users do not see any new controls, messages, or workflow changes. This is an adoption-only transport improvement.

## Local-Safe Compatibility

Preserved.

Mock and disabled-style flows often return no `aiResponseId`, and feedback still works in that case.

## Remaining Gaps

- top-level forwarding is now adopted
- `aiResponseId` is still not mandatory
- hard enforcement of dual alert visibility plus response ownership remains a later backend hardening step
