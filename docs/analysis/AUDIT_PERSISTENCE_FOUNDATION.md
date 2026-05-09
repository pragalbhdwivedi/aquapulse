# Audit Persistence Foundation

## Scope
This pass adds durable Postgres foundations for audit persistence without changing frontend behavior, API contracts, auth semantics, websocket flow, AI runtime behavior, or runtime diagnostics semantics.

## What Was Added
- New relational tables:
  - `audit_events`
  - `audit_event_metadata`
- New migration:
  - `0002_audit_persistence_foundation.sql`
- Updated declarative schema metadata in `packages/database`
- Real Postgres-backed `PostgresAuditRepository`
- Best-effort runtime audit recorder registration
- Best-effort interceptor persistence for successful controller requests when the Postgres audit adapter is active

## What Audit Events Are Now Persisted
When the audit repository is running on the Postgres adapter:
- successful controller requests that pass through `PlaceholderAuditInterceptor`
- persisted event shape remains the existing `AuditEvent` contract:
  - `id`
  - `action`
  - `resourceType`
  - `resourceId`
  - `summary`
  - timestamps

The following internal request-context metadata is also stored in `audit_event_metadata`:
- `request_id`
- `correlation_id`
- `actor_id`
- `http_method`
- `request_path`
- `status_code`

## What Still Remains Placeholder-Backed
- In-memory audit runtime remains the safe default
- Audit API DTOs are still placeholder-thin
- No full append-only compliance pipeline
- No audit retention worker
- No audit export/reporting expansion
- No AI persistence changes

## Why The Metadata Table Was Justified
The public `AuditEvent` contract is intentionally small and could not be widened in this session. The metadata table preserves request-context detail for durable storage without touching shared contracts or frontend behavior.

## Retention Considerations
- This pass adds storage and indexes only
- It does not implement pruning, archiving, or retention automation
- Retention should be handled in a future bounded operational pass
