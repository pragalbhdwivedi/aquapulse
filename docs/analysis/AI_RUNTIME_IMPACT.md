# AI Runtime Impact

## Runtime Impact Summary

Blast radius is intentionally small.

Touched areas:

- additive database schema
- additive migration manifest
- Postgres AI repository implementation
- focused contract coverage

Untouched areas:

- frontend AI behavior
- shared API contracts
- auth/runtime seams
- websocket/live-update flow
- runtime diagnostics
- AI prompt/output behavior

## Behavior Preservation

This pass preserves:

- advisory-only AI behavior
- current request/response contracts
- existing history/review/reuse/compare flow shape
- default local-safe in-memory development behavior

## Fallback Behavior

When Postgres persistence is selected but unavailable:

- request and response writes fall back to in-memory runtime storage
- history reads fall back to bounded in-memory placeholder records
- no AI generation path is blocked by persistence failure

## Migration Safety

Migration `0003_ai_log_persistence_foundation.sql` is additive only:

- creates `ai_requests`
- creates `ai_responses`
- adds indexes only
- does not alter existing tables

## Rollback Strategy

If rollback is required:

1. switch runtime back to the in-memory AI adapter
2. stop applying the `0003` migration in new environments
3. optionally drop:
   - `ai_responses`
   - `ai_requests`

Because the change is additive, rollback does not require API or frontend rollback coordination.

## Remaining Gaps

- no durable feedback persistence
- no durable prompt-template persistence
- no durable action-draft persistence
- no retention automation
- no analytics/reporting expansion

## Recommended Safe Next Step

Stay bounded.

Best next persistence step:

- either durable `ai_feedback` storage
- or a separate bounded retention/export policy pass for the new AI log tables
