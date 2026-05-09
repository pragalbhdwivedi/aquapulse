# Ownership And Read-Scope Audit

## Summary

The recent hardening passes closed public backend exposure for:

- AI
- Audit
- Attachments
- Batches
- Alerts

The main remaining authorization risk is now **overbroad authenticated operator access** rather than anonymous access.

Current bounded auth enforcement answers the question:

- "is this caller an authenticated operator?"

It does **not** yet answer questions such as:

- "should this operator see only their own AI history?"
- "should this operator see only ponds they are responsible for?"
- "should audit history be visible to every operator?"
- "should saved views be private, shared, or supervisor-only?"

## Overall Maturity

Current ownership/read-scope maturity is moderate-to-low because the repo has some natural scope fields but no enforcement model built on top of them yet.

- Route protection maturity: improved
- Ownership/read-scope maturity: still early

Estimated ownership/read-scope maturity: `34%`

## Surface Inventory

### AI history and AI detail

- Current access behavior:
  - protected to authenticated operators
  - all operators can list and read all AI history records
- Sensitivity:
  - moderate to high
  - includes generated operational summaries, handovers, approval-note drafts, incident drafts, and related record metadata
- Available scope fields:
  - `requestedBy`
  - `relatedRecordIds`
  - request payloads may contain `pondId`, `recordId`, `linkedPondId`, `linkedTaskId`, `linkedAlertId`
- Safe to scope without schema change:
  - yes, for a first pass by `requestedBy`
  - yes, for coarse record-link filtering using `relatedRecordIds`
- Safer future model:
  - mixed
  - user-owned history by default, with supervisor/reviewer visibility later if a role model exists

### AI feedback

- Current access behavior:
  - protected to authenticated operators
  - repository path is still placeholder-backed
- Sensitivity:
  - moderate
  - less sensitive than AI outputs, but still contains workflow feedback tied to generated artifacts
- Available scope fields:
  - `submittedBy`
  - `responseId`
- Safe to scope without schema change:
  - only partially
  - runtime persistence is not durable yet
- Safer future model:
  - user-owned with supervisor aggregate visibility later

### Audit history and audit detail

- Current access behavior:
  - protected to authenticated operators
  - all operators can read all audit events
- Sensitivity:
  - high
  - includes request paths, action summaries, resource identifiers, and actor metadata in storage
- Available scope fields:
  - `resourceType`
  - `resourceId`
  - metadata table contains `actorId`, `requestPath`, `requestId`, `correlationId`, `statusCode`
- Safe to scope without schema change:
  - only partially
  - backend API currently returns `AuditEvent` only, not metadata-backed actor scoping
- Safer future model:
  - role-scoped, likely supervisor/reviewer/admin-oriented
  - not user-owned only

### Attachments list and detail

- Current access behavior:
  - protected to authenticated operators
  - all operators can list attachments and filter by `resourceType` / `resourceId`
- Sensitivity:
  - moderate to high depending on attached content
- Available scope fields:
  - `resourceType`
  - `resourceId`
- Missing scope fields:
  - no owner
  - no explicit pond scope
  - no uploader actor
- Safe to scope without schema change:
  - only indirectly via parent resource lookups
- Safer future model:
  - mixed
  - inherit scope from the linked resource instead of attachment ownership alone

### Batches list and detail

- Current access behavior:
  - protected to authenticated operators
  - all operators can list all batches
- Sensitivity:
  - moderate
  - cross-pond stock visibility can become operationally sensitive
- Available scope fields:
  - `pondId`
- Safe to scope without schema change:
  - yes, if a pond-scope model exists
- Safer future model:
  - pond-scoped, possibly with supervisor farm-wide override later

### Alerts list/detail and saved views

- Current access behavior:
  - protected to authenticated operators
  - all operators can read full queue, detail, summary, and saved views
- Sensitivity:
  - high operational sensitivity
  - queue includes cross-pond issues, assignments, review states, latest notes, and action history
- Available scope fields:
  - `pondId`
  - `assignedTo`
  - `reviewState`
- Missing scope fields:
  - saved views have no owner or sharing model
- Safe to scope without schema change:
  - alerts queue/detail: yes for pond-scoped or assignee-scoped filtering
  - saved views: no safe private/shared enforcement without schema change
- Safer future model:
  - mixed
  - queue visibility may remain broad for operators, but saved views likely need owner/shared semantics

### Pond-related records

- Current access behavior:
  - pond list itself is broad
  - related readings and feed can already be queried by pond
- Sensitivity:
  - moderate
  - naturally suited to pond scoping
- Available scope fields:
  - `pondId` across alerts, water-quality, feed, tasks, batches, many AI request payloads
- Safe to scope without schema change:
  - yes, technically
- Safer future model:
  - pond-scoped

### Task assignment visibility

- Current access behavior:
  - task list is broad
  - task detail/update is protected
  - any operator can currently read all tasks
- Sensitivity:
  - moderate
  - assignment and pending-work data may not need to be farm-wide for all users
- Available scope fields:
  - `assigneeId`
  - `pondId`
- Safe to scope without schema change:
  - yes
- Safer future model:
  - mixed
  - own tasks plus pond tasks, with supervisor broader visibility later

### Reports and runtime pages

- Current access behavior:
  - frontend pages sit behind `(protected)` layout
  - backend APIs they call are now operator-protected
  - runtime diagnostics backend route is auth-only rather than role-scoped
- Sensitivity:
  - reports: moderate to high because they aggregate cross-pond data and AI history
  - runtime: moderate, because it exposes auth/runtime mode information
- Safe to scope without schema change:
  - reports: only indirectly by scoping the underlying APIs
  - runtime diagnostics: role scoping would be behavioral, but does not need schema
- Safer future model:
  - reports inherit API scoping
  - runtime diagnostics likely supervisor/admin-oriented if the role model grows

## Highest-Risk Overbroad Authenticated Access

1. Audit history and audit detail
2. AI history and AI detail
3. Alerts saved views
4. Cross-pond alerts queue/detail
5. Broad task visibility
6. Attachments detached from parent-resource scope rules

## Safe-To-Scope Without Schema Change

- AI history by `requestedBy`
- batches by `pondId`
- tasks by `assigneeId` and/or `pondId`
- alerts by `pondId` and/or `assignedTo`
- water-quality/feed style pond-scoped reads if the product chooses to narrow them

## Likely Schema-Required Before Safe Enforcement

- private/shared ownership for saved alert views
- attachment uploader ownership or access inheritance metadata
- richer audit read scoping at API level using persisted metadata
- explicit supervisor/reviewer/admin visibility model
- any fine-grained farm membership table or pond responsibility table

## Recommended First Implementation Seam

The safest first implementation seam is:

- **AI history read scoping by `requestedBy`**

Reason:

- the field already exists in persistence
- the repository already supports `requestedBy` filtering
- the surface is sensitive but operationally bounded
- the change can be isolated to AI history reads without touching shared contracts or schemas

## Routes And Modules That Should Not Be Modified Yet

- `apps/api/src/common/auth/*`
- `apps/api/src/modules/alerts/live-updates/*`
- `apps/api/src/runtime-diagnostics.service.ts`
- `packages/types/src/index.ts`
- `packages/validation/src/index.ts`

## Risk Of Applying Ownership Filtering Too Early

High.

Main risks:

- breaking currently broad operator workflows without a documented replacement
- hiding records that existing pages assume are globally visible
- creating inconsistent scope behavior between list and detail endpoints
- applying user-only filters to surfaces that really need pond or supervisor scope instead

## Safe Implementation Order

1. AI history read scoping by `requestedBy`
2. Task list scoping analysis-to-implementation by `assigneeId` / `pondId`
3. Batch list scoping by `pondId`
4. Alerts queue/read scoping decision
5. Saved-view ownership schema design
6. Audit history role-scope design
7. Attachment inheritance-based scope design
