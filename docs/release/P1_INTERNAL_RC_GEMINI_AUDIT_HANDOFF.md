# P1 Internal RC Gemini Audit Handoff

## Release Tag Candidate

`p1-internal-rc1-authz-bounded`

## Scope

P1 bounded internal RC focused on:

- authorization hardening
- persistence stabilization
- local-safe compatibility
- release guardrails

## Must-Audit Areas

- route protection coverage
- read-scope enforcement
- write-scope enforcement
- AI feedback linkage and ownership checks
- audit mutation restriction in active auth
- live-updates default-off boundary
- local-safe compatibility
- deferred surfaces documentation consistency

## Must-Not-Assume-Complete Areas

- websocket assignment scoping
- saved-view ownership
- reviewer/admin override models
- production deployment automation
- attachment file-content routes
- compliance export and audit self-auditing

## Reviewer Notes

- bounded internal release is acceptable only while live updates remain disabled by default
- active Keycloak alert explanation feedback now requires `aiResponseId`
- local-safe remains intentionally broader than active auth and should be audited as compatibility behavior, not as the final security posture
