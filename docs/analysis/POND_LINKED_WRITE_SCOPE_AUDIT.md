# Pond-Linked Write-Scope Audit

## Scope

This pass reviews mutation authorization boundaries only. It does not change runtime behavior.

Reviewed mutation surfaces:

- `POST /api/ponds`
- `PATCH /api/ponds/:id`
- `POST /api/batches`
- `PATCH /api/batches/:id`
- `POST /api/water-quality`
- `PATCH /api/water-quality/:id`
- `POST /api/feed`
- `PATCH /api/feed/:id`
- `POST /api/attachments`
- `PATCH /api/attachments/:id`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- alert triage and bulk mutation routes
- audit mutation routes
- AI mutation and write-like action routes

## Repo Findings

### Shared baseline

Across ponds, batches, water-quality, feed, attachments, tasks, alerts, audit, and AI:

- mutation routes are authenticated with `@RequireAuthentication()`
- mutation routes are role-gated with `@RequireRoles("operator")`
- controllers still call plain application-service mutation methods for most writes
- local-safe behavior remains intentionally broad because the same guards stay open on the local bypass path

That means most mutation protection today is route-level only, not record-scope or target-scope.

### Already scoped or restricted today

- `POST /api/audit` and `PATCH /api/audit/:id`
  - blocked for ordinary Keycloak operators in `AuditApplicationService`
  - local-safe still broad
  - maturity: hardened

- alert triage and alert lifecycle actions
  - `PATCH /api/alerts/:id`
  - `POST /api/alerts/:id/acknowledge`
  - `POST /api/alerts/:id/resolve`
  - `POST /api/alerts/:id/assign`
  - `POST /api/alerts/:id/unassign`
  - `POST /api/alerts/:id/review-state`
  - `POST /api/alerts/:id/attach-explanation`
  - bulk alert lifecycle and triage routes
  - all call `assertAlertVisibleToRequester(...)` or `assertAlertsVisibleToRequester(...)`
  - in Keycloak mode this uses the same assignment-based visibility seam as alert reads
  - maturity: partially scoped

### Broad and high-risk today

- `POST /api/water-quality`
  - accepts `pondId`
  - creates pond-linked operational data
  - also triggers `alertsApplicationService.upsertOperationalDecision(...)`
  - no pond responsibility check on create

- `PATCH /api/water-quality/:id`
  - updates an existing pond-linked record
  - update DTO also allows `pondId`
  - no current-record or target-pond validation

- `POST /api/feed`
  - accepts `pondId` and optional `batchId`
  - creates pond-linked operational data
  - also triggers `alertsApplicationService.upsertOperationalDecision(...)`
  - no pond responsibility check on create

- `PATCH /api/feed/:id`
  - updates an existing pond-linked record
  - update DTO does not expose `pondId`, but the existing record still belongs to a pond
  - no current-record pond validation

- `POST /api/tasks`
  - accepts `assigneeId` and `pondId`
  - no assignee ownership or pond-scope validation

- `PATCH /api/tasks/:id`
  - allows changing `assigneeId` and `pondId`
  - no existing-task scope or new-target validation

- `POST /api/alerts`
  - accepts `pondId`, `assignedTo`, status, review state, and notes
  - no assignment-scope or pond-scope check
  - competes with the internal runtime alert creation seam used by water-quality/feed decisions

- `PATCH /api/alerts/:id`
  - does check existing alert visibility
  - but still allows broad field mutation once visible, including `pondId`, `assignedTo`, status, and review fields
  - this is safer than a fully broad route, but still not a finished write model

### Broad but structurally unclear today

- `POST /api/ponds`
- `PATCH /api/ponds/:id`

These routes are operator-protected only. They do not map to pond responsibility because:

- create has no target pond to validate
- update modifies the pond record itself, not a child record
- the repo does not yet have an owner/admin/supervisor pond-mutation model

This is a role-model problem, not just a missing scope-check problem.

- `POST /api/batches`
- `PATCH /api/batches/:id`

These routes are also broad, but the current DTOs are skeletal:

- `CreateBatchesDto` only exposes `id?`
- `UpdateBatchesDto` only exposes `id?`

So there is not enough stable target data in the current API surface to apply meaningful pond-responsibility enforcement yet without broader product-model cleanup.

- `POST /api/attachments`
- `PATCH /api/attachments/:id`

These routes are broad and the DTOs are likewise skeletal:

- `CreateAttachmentsDto` only exposes `id?`
- `UpdateAttachmentsDto` only exposes `id?`

The repo now has a parent-resource resolver for reads, but attachment mutation inputs do not currently provide a stable parent link on the controller/service seam for enforcement.

### AI mutation posture

- `POST /api/ai`
- `PATCH /api/ai/:id`

These remain ordinary operator routes in active auth mode and are not owner-scoped. They are broad scaffolding routes and the web client does not expose them.

- AI advisory generation routes such as:
  - `POST /api/ai/alerts/explain`
  - `POST /api/ai/ponds/summarize`
  - `POST /api/ai/handover/generate`
  - `POST /api/ai/text/rewrite`
  - `POST /api/ai/dashboard/query`
  - `POST /api/ai/incidents/draft`
  - `POST /api/ai/approvals/draft-note`
  - are authenticated and role-gated
  - but are not yet pond-scoped or parent-scoped

- `POST /api/ai/alerts/explain/feedback`
  - is the main write-like AI feedback route
  - currently does not receive session scope into the service
  - the in-memory `AlertExplanationService.submitFeedback(...)` stores advisory feedback by `alertId`
  - it does not validate current alert visibility before accepting the feedback

This is a bounded but real future seam. It should eventually reuse alert visibility or the parent-resource decision for the linked alert.

## Recommended Write Model

### Active Keycloak mode

- pond-linked operational writes should require target-resource scope, not just route auth
- create and update should use different validation patterns

Recommended rule shape:

- create
  - validate the target link in the payload before writing
- update
  - validate current record visibility first
  - if the route can change the target link, validate the new target as well

Per module:

- ponds
  - defer to future role model
  - not an ordinary pond-responsibility seam

- batches
  - eventually require pond responsibility
  - but current API shape is too skeletal for safe enforcement now

- water-quality
  - require pond responsibility on create by `pondId`
  - require current-record pond responsibility on update
  - if `pondId` remains mutable on update, require target-pond validation too

- feed
  - require pond responsibility on create by `pondId`
  - require current-record pond responsibility on update
  - if future update allows `pondId`, validate the new target too

- attachments
  - eventually require parent-resource visibility through the existing resolver
  - current mutation DTO seam is too thin for safe implementation now

- tasks
  - defer until task write ownership model is defined
  - assignee-only writes are too narrow for create/reassignment workflows
  - pond-only writes are too broad for cross-assignment edits

- alerts
  - keep current triage/detail visibility seam for lifecycle actions
  - defer broader create/update authority until a clearer operator vs supervisor model exists
  - manual alert creation should likely not remain a generic operator feature long-term

- audit
  - keep restricted in active Keycloak mode

- AI
  - feedback should eventually require linked-alert visibility
  - generic `POST /api/ai` and `PATCH /api/ai/:id` should be reviewed separately because they look like scaffolding, not product-critical operator features

### Local-safe mode

Keep broad behavior for development and demo flows across these mutation seams.

## Safe-Now Implementation Candidates

If the next session wants a small write-scope slice without schema changes or RBAC redesign, the cleanest candidates are:

1. water-quality create/update by pond responsibility
2. feed create/update by pond responsibility

Why these two first:

- both are directly pond-linked
- both already have mature pond read-scope infrastructure available
- both have existing service seams that can read current records
- both drive operational alert side effects, so overbroad writes have cross-module impact

## Not Ready Yet

Do not modify these until their missing model seam exists:

- ponds writes
- batches writes
- attachments writes
- task create/update authority
- alerts create authority
- generic alert patch authority beyond the current assignment visibility seam
- generic AI scaffolding writes

