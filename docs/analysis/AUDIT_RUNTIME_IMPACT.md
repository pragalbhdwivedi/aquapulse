# Audit Runtime Impact

## Runtime Impact Summary
- Default local-safe behavior remains unchanged
- Audit persistence is only activated for runtime-generated events when the Postgres audit adapter is the active repository
- In-memory/default flows still behave as before

## Blast Radius

### Low-Risk Areas Touched
- audit schema definitions
- migration manifest
- audit Postgres repository
- audit module provider wiring
- placeholder audit interceptor

### Untouched By Design
- frontend pages and contracts
- auth semantics
- websocket semantics
- AI generation/runtime behavior
- `packages/types`
- `packages/validation`
- runtime diagnostics payload shape

## Graceful Fallback Behavior
- If Postgres audit persistence is selected but DB operations fail:
  - audit write attempts are swallowed
  - main request flow continues
  - repo methods fall back to placeholder or memory-backed responses
- This keeps audit persistence non-disruptive

## Migration Safety Analysis
- additive only
- no existing table altered
- no existing API contract changed
- no required seed changes for contract verification

## Rollback Strategy
- disable Postgres adapter selection and return to in-memory runtime
- if DB rollback is needed, drop:
  - `audit_event_metadata`
  - `audit_events`
- because no existing tables are mutated, rollback is narrow

## Test Coverage Impact
- schema migration tests updated
- new API contract test added for Postgres audit persistence path
- full existing typecheck and contract suite should remain green

## Remaining Audit Gaps
- no retention automation
- no richer query API for metadata fields
- no explicit failure telemetry for dropped audit writes
- no export workflow
- no broad audit-read UX change

## Safe Next Persistence Seam Recommendation
- AI request/response durable persistence is the closest next safe seam because the runtime port already exists and the same additive migration strategy can be reused
