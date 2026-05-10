# API Surface Inventory

## API Host
- Global prefix: `/api`
- Backend framework: NestJS

## Controller Inventory
- `/api/alerts`
- `/api/ponds`
- `/api/water-quality`
- `/api/feed`
- `/api/tasks`
- `/api/attachments`
- `/api/batches`
- `/api/audit`
- `/api/ai`

## Alerts
- `POST /api/alerts`
- `GET /api/alerts`
- `GET /api/alerts/summary`
- `GET /api/alerts/views`
- `POST /api/alerts/views`
- `POST /api/alerts/views/:id/remove`
- `POST /api/alerts/:id/attach-explanation`
- `GET /api/alerts/live-updates/session`
- `PATCH /api/alerts/:id`
- `POST /api/alerts/bulk/acknowledge`
- `POST /api/alerts/bulk/resolve`
- `POST /api/alerts/bulk/assign`
- `POST /api/alerts/bulk/review-state`
- `POST /api/alerts/:id/acknowledge`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/assign`
- `POST /api/alerts/:id/unassign`
- `POST /api/alerts/:id/review-state`
- `GET /api/alerts/:id`

Status:
- Implemented
- Most mature API surface in the repository
- Mix of protected reads and protected mutations is explicit and bounded

## Ponds
- `POST /api/ponds`
- `GET /api/ponds`
- `PATCH /api/ponds/:id`
- `GET /api/ponds/:id`

Status:
- Implemented
- List is less protected than detail/create/update by design

## Water Quality
- `POST /api/water-quality`
- `GET /api/water-quality`
- `PATCH /api/water-quality/:id`
- `GET /api/water-quality/:id`

Status:
- Implemented
- `GET /api/water-quality` currently acts as the bounded recent-history surface

## Feed
- `POST /api/feed`
- `GET /api/feed`
- `PATCH /api/feed/:id`
- `GET /api/feed/:id`

Status:
- Implemented
- `GET /api/feed` currently acts as the bounded recent/history surface

## Tasks
- `POST /api/tasks`
- `GET /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/tasks/:id`

Status:
- Implemented

## AI
- `POST /api/ai`
- `GET /api/ai`
- `PATCH /api/ai/:id`
- `GET /api/ai/:id`
- `POST /api/ai/alerts/explain`
- `POST /api/ai/alerts/explain/feedback`
- `POST /api/ai/ponds/summarize`
- `POST /api/ai/handover/generate`
- `POST /api/ai/text/rewrite`
- `POST /api/ai/dashboard/query`
- `POST /api/ai/incidents/draft`
- `POST /api/ai/approvals/draft-note`

Status:
- Specialized routes are implemented and used
- Generic CRUD-style AI routes exist mainly because the AI log seam is modeled as a resource

## Audit
- `POST /api/audit`
- `GET /api/audit`
- `PATCH /api/audit/:id`
- `GET /api/audit/:id`

Status:
- Surface exists
- Runtime usefulness is limited because persistence is placeholder-backed

## Attachments
- `POST /api/attachments`
- `GET /api/attachments`
- `PATCH /api/attachments/:id`
- `GET /api/attachments/:id`

Status:
- Surface exists
- Schema/migration coverage is not present in the current relational foundation

## Batches
- `POST /api/batches`
- `GET /api/batches`
- `PATCH /api/batches/:id`
- `GET /api/batches/:id`

Status:
- Surface exists
- Schema/migration coverage is not present in the current relational foundation

## Route Protection Snapshot

### Clearly Protected in Keycloak Mode
- Alerts list/detail/summary reads
- Alerts lifecycle, triage, bulk, saved-view mutation actions
- Ponds detail/create/update
- Water-quality detail/recent/create/update
- Feed detail/recent/create/update
- Tasks detail/create/update

### Less Protected / Operationally Open
- Ponds list
- Tasks list
- Some generic supporting modules without bounded auth decorators

## API Surface Risks
- The endpoint catalog is broad, but not every endpoint is equally mature
- Some modules have API contracts ahead of real DB backing:
  - attachments
  - batches
  - audit
  - AI log persistence
- Generic CRUD surfaces can look production-complete even when the underlying implementation is fallback/placeholder-heavy

## Inventory Conclusion
The core operator API is real and usable. The long tail of supporting APIs is structurally present but not uniformly production-backed.
