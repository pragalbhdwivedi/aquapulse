# Audit Scope Implementation Decision

## Decision

The first safe audit history enforcement slice should be:

- scope `GET /api/audit` by `audit_event_metadata.actor_id` in active authenticated Keycloak mode
- scope `GET /api/audit/:id` by the same actor-based rule
- return not found for out-of-scope detail
- keep local-safe broad
- leave API contracts, frontend behavior, interceptor behavior, and schema unchanged

## Why This Is The Right First Slice

- `actor_id` already exists in durable storage
- runtime interceptor writes already populate it for the intended audit stream
- no broader reviewer/admin role model exists in the repo today
- the current frontend audit surface is a low-risk placeholder
- this matches the bounded enforcement style already used for AI history, tasks, and alerts

## What This Decision Explicitly Does Not Do

- no admin/owner all-audit visibility
- no supervisor cross-operator visibility
- no module-level reviewer policies
- no compliance export model
- no self-auditing of audit access
- no frontend redesign
- no API contract expansion

## Required Implementation Notes For The Future Coding Slice

- do not rely on the current broad audit `getById()` alone in Keycloak mode
- use a metadata-aware actor-scoped lookup path before returning detail
- treat rows with missing `actor_id` as non-readable to normal operators
- preserve local-safe broad behavior

## Final Answers

- Actor-based audit scoping is safe now: `Yes, for active-auth list/detail reads, with metadata-less rows hidden from normal operators.`
- Audit mutation routes need stricter protection: `Yes.`
- Audit list and detail must be scoped together: `Yes.`
- Local-safe remains broad: `Yes.`
- Schema change required for first actor-based read rule: `No.`
- Role model required for owner/admin/supervisor audit visibility: `Yes.`

## Recommended Next Branch And Commit

- Branch: `analysis/p1-audit-history-scope-finalization`
- Commit: `chore(analysis): finalize audit history read-scope model before enforcement`
