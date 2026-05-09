# Technical Debt Hotspots

## Top Hotspots

### 1. Runtime mode complexity
- Web and API both support bounded mock/in-memory/http/postgres/auth transitions
- This is valuable, but it creates high cognitive load

### 2. Placeholder naming in active auth/runtime code
- `PlaceholderAuthGuard`
- `PlaceholderRoleGuard`
- `PlaceholderAuditInterceptor`

These are not fully fake, but their names signal unfinished architecture.

### 3. Schema/runtime mismatch
- Core modules are migrated
- Supporting modules expose repos/controllers without matching migrations

### 4. Audit pipeline incompleteness
- Interceptor exists
- placeholder TODO explicitly says real forwarding into audit pipeline is pending

### 5. AI persistence mismatch
- AI generation logic is real
- AI repo interface is broad
- Postgres AI persistence remains placeholder-backed

### 6. Worker app placeholder
- `apps/worker` exists, which implies background-runtime intent
- No implementation currently exists

### 7. `packages/ai` placeholder
- Package exists but does not yet function as a shared AI runtime layer

### 8. Root README drift
- Repository root docs no longer describe the actual stack or repo shape

### 9. Supporting module maturity gap
- Attachments, batches, audit exist as modules and APIs
- Their persistence hardening is not at the same maturity as alerts/ponds/feed/tasks/water-quality

### 10. Large shared contract surface
- `packages/types/src/index.ts` is carrying a lot of endpoint, runtime, auth, and AI surface area
- This is useful but becomes risky if changed casually

## Additional Debt Signals
- Some unicode/encoding artifacts remain in text fallback strings
- Placeholder row factories are widely used across DB mapping and tests
- Generic CRUD surfaces can imply more completeness than the underlying implementation actually has

## Debt Prioritization

### Highest Priority
- missing schema/migration coverage for non-core supporting modules
- audit pipeline persistence
- AI persistence backing
- root docs drift

### Medium Priority
- worker/package placeholders
- rationalizing runtime env complexity

### Lower Priority
- naming cleanup after rollout semantics stabilize

## Summary
The repo’s main debt is not “nothing is built.” The real debt is “many bounded systems are built, but some platform seams are still ahead of their persistence and rollout maturity.”
