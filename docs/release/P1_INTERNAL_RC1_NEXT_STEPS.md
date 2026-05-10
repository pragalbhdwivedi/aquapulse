# P1 Internal RC1 Next Steps

## Immediate Post-RC Priorities

1. Review alerts live-updates scope before any broader enablement.
2. Design and implement saved-view ownership if cross-operator sharing becomes a problem.
3. Refine pond, batch, and attachment write authority.
4. Keep attachment file-content authorization coupled to attachment metadata scope if a download route is introduced.

## Recommended Next Work Queue

### 1. Live Updates Authorization

- keep default-off in place
- do not enable broadly until assignment-aware delivery exists
- treat websocket scoping as a distinct follow-up project

### 2. Saved Views

- add ownership or sharing semantics
- avoid implying current saved views are private

### 3. Pond-Linked Mutation Refinement

- pond writes
- batch writes
- attachment writes

### 4. AI Review Maturity

- reviewer/admin workflow only after product intent is explicit
- no dashboard or analytics expansion until the review model is settled

### 5. Audit/Compliance Follow-Up

- compliance export model
- audit self-auditing

## Operating Guidance After RC1

- continue using local-safe for broad demo flows
- use active Keycloak verification for authorization confidence
- keep live updates off unless intentionally testing the bounded deferred websocket seam

## Suggested Next Release Framing

If follow-up work proceeds cleanly, the next internal candidate should focus on one of:

- websocket and saved-view boundary completion
- pond-linked write-authority completion
- audit/compliance follow-up
